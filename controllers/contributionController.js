'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Contribution = require('../models/contribution');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var curriedHandleError = _.curry(helpers.handleError);


function list(req, res) {
  Contribution.find().exec()
    .then(function (items) {
      var model = {
        items: items
      };
      res.render('contribution/list', model);
    })
    .catch( curriedHandleError(req, res) );
}

function view(req, res) {
  var id = req.param('id');
  var proposal;
  Contribution.findOne({_id: id}).exec()
    .then(function (item) {
      var model = {
        item: item,
      };
      res.render('contribution/view', model);
    })
    .catch( curriedHandleError(req, res) );
}

function showPledge(req, res) {
  var proposalId = req.param('pid');
  var voteId = req.param('vid');
  var lastAction = req.param('la');
  var model = {item: {}};
  if (lastAction) {
    model.lastAction = lastAction;
  }
  model.messages = req.flash('error');

  Proposal.findOne({_id: proposalId}).exec()
    .then(function (proposal) {
      model.proposal = proposal;
      // todo: validation and error message handling
      if (voteId) {
        return Vote.findOne({_id: voteId});
      } else {
        return null;
      }
    })
    .then(function(vote) {
      if (vote) {
        model.vote = vote;
        model.anticipatedCapital = vote.anticipatedCapital;
        model.anticipatedPatronage = vote.anticipatedPatronage;
      }
      res.render('contribution/pledge', model)
    })
    .catch( curriedHandleError(req, res) );
}

function postPledge(req, res) {
  console.log("postPledge - req: " + req + ", res: " + res);
  var proposalId = req.body.proposalId;
  var pledgedCapital = req.body.pledgedCapital;
  var pledgedPatronage = req.body.pledgedPatronage;

  var contribution = new Contribution({
    proposalId: proposalId
    , pledgedCapital: pledgedCapital
    , pledgedPatronage: pledgedPatronage
  });
  if (req.user) {
    contribution.userId = req.user._id;
    contribution.userName = req.user.name;

    console.log("userid: " + contribution.userId);
  }

  contribution.save()
    .then(function() {
      if (! req.user) {
        console.error("post pledge - need to bind supporter");
        req.session.pending = {
          action: 'pledge'
          , contributionId: contribution._id
          , message: 'please signin or login to complete your pledge'};
        res.redirect('/signup');
      } else {
        handlePledgeSuccess(req, res, contribution);
//        res.redirect('/c/contribute?pid=' + contribution.proposalId + 'cid=' + contribution._id + '&la=p');
      }

    })
    .catch( curriedHandleError(req, res) )
}

function handlePledgeSuccess(req, res, contribution) {
  var path = '/c/contribute?pid=' + contribution.proposalId + '&cid=' + contribution._id + '&la=pledge';
  res.redirect(path)

}


function handlePending(req, res) {

  var pending = req.session.pending;
  if ( ! pending ) {
    return false;
  }

  console.log('pending action: ' + pending.action);

  if ( ! req.user ) {
    throw new Error('unexpected missing user context')
  }

  if (pending.action == 'pledge') {
    delete req.session.pending;
    Contribution.findOne({_id: pending.contributionId}).exec()
      .then(function (contribution) {
        contribution.userId = req.user._id;
        contribution.userName = req.user.name;
        console.log("userid: " + contribution.userId);
        return contribution.save();
      }).then(function (contribution) {
        if (pending.action == 'pledge') {
          handlePledgeSuccess(req, res, contribution);
        }
      })
      .catch(curriedHandleError(req, res));
    return true;
  } else if (pending.action == 'contribute') {
    // todo, this currently leaves the 'session.pending' state.  we should delete and create new session.payment state
    res.redirect('/pay');
    return true;
  } else {
    return false;
  }
}

function showContribute(req, res) {
  var proposalId = req.param('pid');
  var contributionId = req.param('cid');
  var lastAction = req.param('la');
  var proposal;
  console.log("last action: " + lastAction);
  Proposal.findOne({_id: proposalId}).exec()
    .then(function(found) {
      proposal = found;
      return Contribution.findOne({_id: contributionId})
    })
    .then(function(found) {
      var contribution = found;
      var defaultCapital = found ? found.pledgedCapital : "";
      console.log("contribution: " + contribution);
      var model = {contribution: contribution, proposal: proposal, defaultCapital: defaultCapital};
      if (lastAction) {
        model.lastAction = lastAction;
      }
      // todo: validation and error message handling
      model.messages = req.flash('error');
      res.render('contribution/contribute', model);
    })
    .catch( curriedHandleError(req, res) );
}

function postContribute(req, res) {
  var contributionId = req.body.contributionId;
  var proposalId = req.body.proposalId;
  var proposalTitle = req.body.proposalTitle;
  var capital = req.body.capital;
  var patronage = req.body.patronage;
  req.session.pending = {
    action: 'contribute'
    , contributionId: contributionId
    , proposalId: proposalId
    , proposalTitle: proposalTitle
    , capital: capital
    , patronage: patronage
    , message: 'please signin or login to complete your contribution'
  };

  if (! req.user) {
    console.error("post contribution - need to bind supporter");
    res.redirect('/signup');
  } else {
    res.redirect('/pay');
  }
}


function upsertPendingContribution(req, res) {
  console.log('pending: ' + _.inspect(req.session.pending));
  var contributionId = req.session.pending.contributionId;
  var proposalId = req.session.pending.proposalId;
  var capital = req.session.pending.capital;
  var patronage = req.session.pending.patronage;

  delete req.session.pending;

  if (contributionId) {
    // updated existing pledge record
    Contribution.findOne({_id: contributionId}).exec()
      .then(function (contribution) {
        contribution.paidCapital = capital;
        contribution.paidPatronage = patronage;
        return contribution.save();
      }).then(function (contribution) {
        res.redirect('/c/' + contribution._id + '/thanks');
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
        res.redirect('/c/' + saved._id + '/thanks');
      })
      .catch(curriedHandleError(req, res))
  }
}



function addRoutes(router) {
  router.get('/c', list);
  router.get('/c/view', view);
  router.get('/c/:pid/view', view);
  router.get('/c/pledge', showPledge);
  router.get('/p/:pid/pledge', showPledge);
  router.post('/c/pledge', postPledge);
  router.get('/c/contribute', showContribute);
  router.get('/p/:pid/contribute', showContribute);
  router.post('/c/contribute', postContribute);
  //router.get('/c/payment', showPayment);
  //router.get('/c/:pid/payment', showPayment);
  //router.post('/c/payment', postPayment);
  //router.get('/c/paymentDwolla', showDwolla);
  //router.get('/c/paymentCheck', showCheck);
  //router.post('/c/paymentCheck', postCheck);
  //router.get('/c/paymentStripe', showStripe);
  //router.post('/c/paymentStripe', postStripe);
  //router.get('/c/paymentBraintree', showBraintree);
  //router.post('/c/paymentBraintree', postBraintree);
  //router.get('/c/paymentAuthorizeNet', showAuthorizeNet);
  //router.post('/c/paymentAuthorizeNet', postAuthorizeNet);
  //router.get('/c/paymentBitcoin', showBitcoin);
  //
  //router.get('/api/binbase/:bin', fetchBinbase);
  //router.get('/api/estimateFee', estimateFee);

//  passthrough(router, 'c/thanks');
  router.get('/c/thanks', function (req, res) { res.render('contribution/thanks', {}) });
  router.get('/c/:cid/thanks', function (req, res) { res.render('contribution/thanks', {}) });


}


module.exports = {
  addRoutes: addRoutes
  , handlePending: handlePending
}

