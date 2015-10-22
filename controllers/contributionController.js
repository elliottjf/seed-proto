'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Contribution = require('../models/contribution');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var curriedHandleError = _.curry(helpers.handleError)

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
  Proposal.findOne({_id: proposalId}).exec()
    .then(function (proposal) {
      var model = {proposal: proposal, item: {}};
      // todo: validation and error message handling
      model.messages = req.flash('error');
      res.render('contribution/pledge', model)
    })
    .catch( curriedHandleError(req, res) );
}

function postPledge(req, res) {
  console.log("postPledge - req: " + req + ", res: " + res)
  var proposalId = req.body.proposalId
  var pledgedCapital = req.body.pledgedCapital
  var pledgedPatronage = req.body.pledgedPatronage

  var item = new Contribution({
    proposalId: proposalId
    , pledgedCapital: pledgedCapital
    , pledgedPatronage: pledgedPatronage
  });
  if (req.user) {
    item.userId = req.user._id;
    console.log("userid: " + item.userId)
  }

  item.save()
    .then(function() {
      if (! req.user) {
        console.error("post pledge - need to bind supporter");
        req.session.pending = {action: 'pledge', contributionId: item._id, message: 'please signin or login to complete your pledge'};
        res.redirect('/signup');
      } else {
        res.redirect('/c/contribute?id=' + item._id + '&la=p');
      }

    })
    .catch( curriedHandleError(req, res) )
}

function handlePending(req, res) {

  var pending = req.session.pending
  if ( ! pending || pending.action != 'pledge' ) {
    return false;
  }

  console.log('pending action: ' + pending.action)

  if ( ! req.user ) {
    throw new Error('unexpected missing user context')
  }

  delete req.session.pending

  Contribution.findOne({_id: pending.contributionId}).exec()
    .then(function (item) {
      item.userId = req.user._id;
      console.log("userid: " + item.userId)
      return item.save();
    }).then(function (item) {
      if (pending.action == 'pledge') {
        res.redirect('/c/contribute?id=' + item._id + '&la=p');
      }
    })
    .catch( curriedHandleError(req, res) );
  return true
}

function showContribute(req, res) {
  var id = req.param('id');
  var lastAction = req.param('la')
  console.log("last action: " + lastAction)
  Contribution.findOne({_id: id}).exec()
    .then(function (item) {
      var model = {item: item, proposal: {}}; //todo: fetch parent proposal
      if (lastAction) {
        model.lastAction = lastAction;
      }
      // todo: validation and error message handling
      model.messages = req.flash('error');
      res.render('contribution/contribute', model);
    })
    .catch( curriedHandleError(req, res) );
}

function addRoutes(router) {
  router.get('/c', list);
  router.get('/c/view', view);
  router.get('/c/pledge', showPledge);
  router.post('/c/pledge', postPledge);
  router.get('/c/contribute', showContribute);
//    router.post('/c/contribute', exports.postVote);
}


module.exports = {
  addRoutes: addRoutes
  , handlePending: handlePending
}

