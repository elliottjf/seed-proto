'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var curriedHandleError = _.curry(helpers.handleError);


function list(req, res) {
  Proposal.find().exec()
    .then(function (items) {
      console.log("inside find callback");
      var model = {
        items: items
      };
      res.render('proposal/list', model);
    })
    .catch( curriedHandleError(req, res) );
}

function view(req, res) {
  var id = req.param('id');
  var proposal;
  Proposal.findOne({_id: id}).exec()
    .then(function (item) {
      proposal = item;
      return Vote.find({proposalId: item._id});
    })
    .then(function (votes) {
      var model = {
        item: proposal,
        votes: votes
      };
      res.render('proposal/view', model);
    })
    .catch( curriedHandleError(req, res) );
}

function showEdit(req, res) {
  //todo: edit existing record
  var model = {item: {}};
  res.render('proposal/edit', model);
}

function postEdit(req, res) {
  console.log("body.title: " + req.body.title);
  var title = req.body.title && req.body.title.trim();
  var summary = req.body.summary && req.body.summary.trim();

  //Some very lightweight input checking
  //if (name === '' || isNaN(price)) {
  //    res.redirect('/products#BadInput');
  //    return;
  //}

  var item = new Proposal({title: title, summary: summary});
  console.log("item: " + item);
  item.save()
    .then(function() {
      res.redirect('/p');
    })
    .catch( curriedHandleError(req, res) );
}


function showVote(req, res) {
  var id = req.param('pid');
  Proposal.findOne({_id: id}).exec()
    .then(function (proposal) {
      var model = {proposal: proposal, item: {}};
      // todo: validation and error message handling
      model.messages = req.flash('error');
      res.render('proposal/vote', model);
    })
    .catch( curriedHandleError(req, res) );
}

function postVote(req, res) {
  //if (! req.user) {
  //  console.error("post vote - not logged in");
  //  throw new Error("post vote - not logged in");
  //}
  var model = {};
  model.voteRank = req.param('voteRank');
  model.anticipatedCapital = req.param('anticipatedCapital');
  model.anticipatedPatronage = req.param('anticipatedPatronage');
  model.workerInterest = req.param('workerInterest');
  var proposalId = req.param('proposalId');
//    var _id = new mongoose.Types.ObjectId(proposalId);
//    console.log("_id: " + _id);
//    model.proposal = _id;
  model.proposalId = proposalId;
  if (req.user) {
    console.log("userId: " + req.user._id);
    model.userId = req.user._id;
  }

  Vote.create(model)
    .then(function(item) {
      console.log("new vote id: " + item._id + ", obj: " + item);
      if (! req.user) {
        req.session.pending = {action: 'vote', voteId: item._id, message: 'please signin or login to register your vote'};
        res.redirect('/signup');
      } else {
        handleVoteSuccess(req, res, item);
      }
    })
    .catch( curriedHandleError(req, res) );
}

function handleVoteSuccess(req, res, vote) {
  var path = '/c/pledge?pid=' + vote.proposalId + '&la=v';
  res.redirect(path);

}



function handlePending(req, res) {

  var pending = req.session.pending;
  if ( ! pending || pending.action != 'vote' ) {
    return false;
  }

  console.log('pending action: ' + pending.action);

  if ( ! req.user ) {
    throw new Error('unexpected missing user context')
  }

  delete req.session.pending;

  Vote.findOne({_id: pending.voteId}).exec()
    .then(function (item) {
      item.userId = req.user._id;
      console.log("userid: " + item.userId);
      return item.save();
    }).then(function (item) {
      handleVoteSuccess(req, res, item);
    })
    .catch( curriedHandleError(req, res) );
  return true
}


function voteView(req, res) {
  console.log("root index.js - vote/view");
  //var model = {item: {id:1,title:"the first proposal"}};
  //res.render('proposal/view', model);
  var id = req.param('id');
  Vote.findOne({_id: id}).exec()
    .then(function(item) {
      var model = { item: item };
      res.render('vote/view', model);
    })
    .catch( curriedHandleError(req, res) );
}

function addRoutes(router) {
  router.get('/p', list);
  router.get('/p/view', view);
  router.get('/p/edit', showEdit);
  router.post('/p/edit', postEdit);
  router.get('/p/vote', showVote);
  router.post('/p/vote', postVote);
  router.get('/vote/view', voteView);
}

module.exports = {
  addRoutes: addRoutes
  , handlePending: handlePending
};
