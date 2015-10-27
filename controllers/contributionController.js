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
      }

    })
    .catch( curriedHandleError(req, res) )
}

function handlePledgeSuccess(req, res, contribution) {
  //var path = '/c/contribute?pid=' + contribution.proposalId + '&cid=' + contribution._id + '&la=pledge';
  var path = '/p/' + contribution.proposalId + '/contribute?cid=' + contribution._id + '&la=pledge';
  res.redirect(path)

}


function handlePending(req, res) {

  var pending = req.session.pending;
  if ( ! pending ) {
    return false;
  }

  console.log('pending action: ' + pending.action);

  // factor state validation into route mappings
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
    delete req.session.pending;
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
  req.session.cart = {
    kind: 'contribution'
    , contributionId: contributionId
    , proposalId: proposalId
    , proposalTitle: proposalTitle
    , amount: capital
    , capital: capital  // todo: remove usages
    , successMethodName: 'handleContributionPaymentSuccess'
    //, successUrl: '/c/' + contributionId + '/thanks'
    //, patronage: patronage
  };

  if (! req.user) {
    console.info("post contribution - need to bind supporter");
    req.session.pending = {
      //todo: can eliminate some of these fields, need to factor over usage to cart session model
      action: 'contribute'
      , contributionId: contributionId
      , proposalId: proposalId
      , proposalTitle: proposalTitle
      , capital: capital
      , patronage: patronage
      , message: 'please signin or login to complete your contribution'
    };
    res.redirect('/signup');
  } else {
    res.redirect('/pay');
  }
}

require('./paymentController').mapMethod('handleContributionPaymentSuccess', handleContributionPaymentSuccess);



function handleContributionPaymentSuccess(req, res) {
  console.log('handlepaymentsuccess cart: ' + _.inspect(req.session.cart));
  var contributionId = req.session.cart.contributionId;
  var proposalId = req.session.cart.proposalId;
  //todo: switch on cart.kind - for now only capital contribution
  var capital = req.session.cart.amount;
  //var patronage = req.session.pending.patronage;

  //delete req.session.cart;

  if (contributionId) {
    // updated existing pledge record
    Contribution.findOne({_id: contributionId}).exec()
      .then(function (contribution) {
        contribution.paidCapital = capital;
        //contribution.paidPatronage = patronage;
        return contribution.save();
      }).then(function (contribution) {
        //res.redirect('/c/' + contribution._id + '/thanks');
        //res.redirect(cart.successUrl);
        gotoThanks(req, res, contribution);
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
        //res.redirect('/c/' + saved._id + '/thanks');
        gotoThanks(req, res, saved);
      })
      .catch(curriedHandleError(req, res))
  }
}

function gotoThanks(req, res, contribution) {
  delete req.session.cart;
  res.redirect('/c/' + contribution._id + '/thanks');

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
  //router.get('/c/thanks', function (req, res) { res.render('contribution/thanks', {}) });
  router.get('/c/:cid/thanks', function (req, res) { res.render('contribution/thanks', {}) });
}




module.exports = {
  addRoutes: addRoutes
  , handlePending: handlePending
  , handleContributionPaymentSuccess: handleContributionPaymentSuccess
};

// create serializable binding to success method, since we can't store methods directly in the session
//require('./paymentController').mapMethod('handleContributionPaymentSuccess', module.exports.handleContributionPaymentSuccess);
//var paymentController = require('./paymentController');
//paymentController.mapMethod('handleContributionPaymentSuccess', module.exports.handleContributionPaymentSuccess);
//console.log("resolved: " + paymentController.resolveMethod('handleContributionPaymentSuccess'));

