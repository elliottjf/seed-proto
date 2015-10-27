'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Contribution = require('../models/contribution');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var curriedHandleError = _.curry(helpers.handleError);

var stripe = require('../lib/stripe').instance();
var braintree = require('../lib/braintree').instance();
var authorizeNet = require('../lib/authorizeNet').instance();
var Binbase = require('../models/binbase');


/** checks that the expected session state exists, and passes control on the main handler if so
 * otherwise, redirects to safe home and short curcuits flow
 */
function handleMissingState(req, res, next) {
  if (req.session.pending) {
    next(); // proceed with normal flow
  } else {
    console.error("payment flow - missing pending state");
    res.redirect('/p');
  }
}


function showPayment(req, res) {
//  var model = {pending: req.session.pending}
  var model = req.session.pending;
  model.messages = req.flash('error');
  res.render('payment/index', model);
}

function postPayment(req, res) {
  var paymentMethod = req.body.paymentMethod;
  res.redirect('/pay/' + paymentMethod);
}

function showDwolla(req, res) {
  var model = req.session.pending;
  model.messages = req.flash('error');
  res.render('payment/dwolla', model);
}

function showStripe(req, res) {
  var model = req.session.pending;
  model.amount = model.capital;
  model.amountCents = model.capital * 100;
  model.publicKey = stripe.config.publicKey;
  model.messages = req.flash('error');
  res.render('payment/stripe', model);
}

function postStripe(req, res) {
  var amountCents = req.body.amountCents;
  var description = req.body.description;
  var stripeToken = req.body.stripeToken;
  var stripeTokenType = req.body.stripeTokenType;
  var stripeEmail = req.body.stripeEmail;
  console.log('postStripe - token: ' + stripeToken + ', type: ' + stripeTokenType + ', emai: ' + stripeEmail);

  var charge = stripe.charges.create({
    amount: amountCents // amount in cents, again
    , currency: "usd"
    , source: stripeToken
    , description: description
  }, function (err, charge) {
    console.log('stripe response - err: ' + err + ', charge: ' + _.inspect(charge));
    if (err && err.type === 'StripeCardError') {
      // The card has been declined
      req.flash('error', "Sorry, that card has been declined");
      res.redirect('/pay/stripe');
    } else if (charge) {
      //res.redirect('/pay/thanks');
      handleThanks(req, res);
    } else {
      req.flash('error', 'Sorry, there was an unexpected error: ' + err);
      res.redirect('/pay/stripe');
    }
  });
}


function showBraintree(req, res) {
  var model = req.session.pending;
  model.amount = model.capital;
//    model.amountCents = model.capital * 100
  model.messages = req.flash('error');
  var clientToken;

  console.log('braintree: ' + _.inspect(braintree));;
  braintree.clientToken.generate({}, function (err, result) {
    model.clientToken = result.clientToken;
    console.log('clientToken: ' + clientToken);
    res.render('payment/braintree', model);
  });

}

function postBraintree(req, res) {
  var amount = req.body.amount;
  var description = req.body.description;
  var paymentMethodNonce = req.body.payment_method_nonce;

  console.log('postBraintree - nonce: ' + paymentMethodNonce);

  braintree.transaction.sale({
    amount: amount
    , paymentMethodNonce: paymentMethodNonce
  }, function (err, result) {
    console.log('braintree response - err: ' + err + ', result: ' + _.inspect(result));
    if (err) { //} && err.type === 'StripeCardError') {
      // The card has been declined
      req.flash('error', "Sorry, that card has been declined");
      res.redirect('/pay/braintree')
    } else if (result) {
      //res.redirect('/pay/thanks');;
      handleThanks(req, res); //todo: should probably be calling upsert...
    } else {
      req.flash('error', 'Sorry, there was an unexpected error: ' + err);
      res.redirect('/pay/braintree');
    }
  });
}

function showAuthorizeNet(req, res) {
  var model = req.session.pending;
  model.amount = model.capital;
  model.messages = req.flash('error');
  var clientToken;

  res.render('payment/authorizeNet', model);

}

function postAuthorizeNet(req, res) {
  var amount = req.body.amount;
  var cardNumber = req.body.cardNumber;
  var expYear = req.body.expYear;
  var expMonth = req.body.expMonth;

  console.log('postAuthorizeNet');

  authorizeNet.authCaptureTransaction(amount, cardNumber, expYear, expMonth)
    .then(function (transaction) {
      console.log('authorize.net response - transaction: ' + _.inspect(transaction));

      if (transaction.transactionResponse.responseCode == 1) {
        //todo store transaction record
        upsertPendingContribution(req, res);
//        res.redirect('/c/thanks');
      } else {
        // not sure if this flow is possible or not
        console.log('authnet failure - tranresp: ' + transaction.transactionResponse);
        req.flash('error', 'Sorry, there was an error processing your transaction');
        res.redirect('/pay/authorizeNet');
      }
    })
    .catch(function(result) {
      // todo: catch and display error page if exception throw in the catch block
      console.log('authnet failure - err: ' + _.inspect(result));
      var message = 'Sorry, there was an error processing your transaction: ' + _.inspect(result);  // extra verbose by default for now unless we extra our expected nested error text

      console.log('tran response: ' + _.inspect(result.transactionResponse));
      // todo: use some sort of jsonpath util here
      if (result.transactionResponse && result.transactionResponse.errors) {
        var errors = result.transactionResponse.errors;
        if (errors.error && errors.error.errorText) {
          message = errors.error.errorText;
        }
      }
      req.flash('error', message);
      res.redirect('/pay/authorizeNet');
    })
}


function showCheck(req, res) {
  var model = req.session.pending;
  console.log('showCheck - model: ' + _.inspect(model));
  model.messages = req.flash('error');
  res.render('payment/check', model);
}

function postCheck(req, res) {
  console.log("postCheck");
  // todo: factor the post payment updates
  upsertPendingContribution(req, res);
}

function upsertPendingContribution(req, res) {
  console.log('pending: ' + _.inspect(req.session.pending));
  var contributionId = req.session.pending.contributionId;
  var proposalId = req.session.pending.proposalId;
  var capital = req.session.pending.capital;
  var patronage = req.session.pending.patronage;

  //todo: delete after displaying 'thanks' page
  //delete req.session.pending;

  if (contributionId) {
    // updated existing pledge record
    Contribution.findOne({_id: contributionId}).exec()
      .then(function (contribution) {
        contribution.paidCapital = capital;
        contribution.paidPatronage = patronage;
        return contribution.save();
      }).then(function (contribution) {
        //res.redirect('/c/' + contribution._id + '/thanks');
        //res.redirect('/pay/thanks');
        handleThanks(req, res);
      })
      .catch(curriedHandleError(req, res));
  } else {
    // no pledge context, create a new contribution record
    var contribution = new Contribution({
      proposalId: proposalId
      , paidCapital: capital
//      , paidPatronage: patronage
      , userId: req.user._id
      , userName: req.user.name
    });
    contribution.save()
      .then(function (saved) {
        req.session.pending.contributionId = saved._id;
        //res.redirect('/c/' + saved._id + '/thanks');
//        res.redirect('/pay/thanks');
        handleThanks(req, res);
      })
      .catch(curriedHandleError(req, res))
  }
}

function handleThanks(req, res) {
  var contributionId = req.session.pending.contributionId; //todo: generic handling
  res.redirect('/c/' + contributionId + '/thanks');

}

function showBitcoin(req, res) {
  var model = req.session.pending;
  model.messages = req.flash('error');
  res.render('payment/bitcoin', model);
}

function fetchBinbase(req, res) {
  var bin = req.params.bin;
  var amount = req.params.amount;
  console.log('bin: ' + bin + ", amount: " + amount);
  Binbase.findOne({bin: bin}).exec()
    .then(function (item) {
      if (amount) {
        item.estimatedFee = calculateFee(item, amount);  // should clone first or nest result
      }
      res.json(200, item);
    })
    .catch( curriedHandleError(req, res) );
}

function estimateFee(req, res) {
  var bin = req.params.bin || req.query.bin;
  var amount = req.params.amount || req.query.amount;
  console.log('bin: ' + bin + ", amount: " + amount);
  Binbase.findOne({bin: bin}).exec()
    .then(function (item) {
      console.log("found binbase: " + item);
      var result = calculateFee(item, amount);
//      _.merge(result, item);
      //todo, not sure why the merge didn't work. mongoose magic?
      result.cardBrand = item.cardBrand;
      result.issuingOrg = item.issuingOrg;
      result.cardType = item.cardType;
      result.cardCategory = item.cardCategory;
      result.isRegulated = item.isRegulated;
      res.json(200, result);
    })
    .catch( curriedHandleError(req, res) );
}

function calculateFee(binbase, amount) {
  var base = 0.30;
  var percent = 2.9;
  var message = null;
  if (binbase) {
    if (binbase.cardBrand == 'AMEX') {
      base = 0.30;
      percent = 3.5;
      message = "Tip: AMEX has the highest fees!";
    }
    if (binbase.cardBrand == 'VISA' || binbase.cardBrand == 'MASTERCARD') {
      if (binbase.cardType == 'DEBIT') {
        base = 0.22;
        if (binbase.isRegulated) {
          percent = 0.05;
          message = "Good choice, Debit Cards have the lowest fees!"
        } else {
          percent = 0.80;
          message = "Good choice, Debit Cards have lower fees."
        }
      } else {
        base = 0.12;
        message = "Tip: Debit Cards generally have lower fees than Credit Cards";
        if (binbase.cardCategory == 'PLATINUM' || binbase.cardCategory == 'BUSINESS') {
          percent = 2.9;
          message += ", and Rewards Cards have the highest fees."
        } else if (binbase.cardCategory == 'GOLD') {
          percent = 2.2;
          message += ", and Rewards Cards have higher fees."
        } else {
          percent = 1.8;
        }
      }
    }
    if (amount < 20) {
      message = "";
    }

  }
  var fee = base + amount * percent/100;
  fee = Math.ceil(fee * 100) / 100;
  console.log('calcfee - ' + binbase + ', base: ' + base + ', %: ' + percent + ' = ' + fee);
  return {estimatedFee: fee, feeTip: message};
}


function addRoutes(router) {
  router.get('/pay', handleMissingState, showPayment);
  router.post('/pay/by', handleMissingState, postPayment);
  router.get('/pay/dwolla', handleMissingState, showDwolla);
  router.get('/pay/check', handleMissingState, showCheck);
  router.post('/pay/check', handleMissingState, postCheck);
  router.get('/pay/stripe', handleMissingState, showStripe);
  router.post('/pay/stripe', handleMissingState, postStripe);
  router.get('/pay/braintree', handleMissingState, showBraintree);
  router.post('/pay/braintree', handleMissingState, postBraintree);
  router.get('/pay/authorizeNet', handleMissingState, showAuthorizeNet);
  router.post('/pay/authorizeNet', handleMissingState, postAuthorizeNet);
  router.get('/pay/bitcoin', handleMissingState, showBitcoin);

  //router.get('/pay/thanks', function (req, res) { res.render('payment/contribution/thanks', {}) });

  router.get('/api/binbase/:bin', fetchBinbase);
  router.get('/api/estimateFee', estimateFee);

  //router.get('/c/thanks', function (req, res) { res.render('contribution/thanks', {}) });
  //router.get('/c/:cid/thanks', function (req, res) { res.render('contribution/thanks', {}) });


}


module.exports = {
  addRoutes: addRoutes
}

