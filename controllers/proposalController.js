'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var curriedHandleError = _.curry(helpers.handleError);


module.exports = {

  list: function (req, res) {
    Proposal.find().exec()
      .then(function (items) {
        console.log("inside find callback");
        var model = {
          items: items
        };
        res.render('proposal/list', model);
      })
      .catch( curriedHandleError(req, res) );
  },

  view: function (req, res) {
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
  },

  showEdit: function (req, res) {
    //todo: edit existing record
    var model = {item: {}};
    res.render('proposal/edit', model);
  },

  postEdit: function (req, res) {
    console.log("body.title: " + req.body.title);
    var title = req.body.title && req.body.title.trim();
    var summary = req.body.summary && req.body.summary.trim();

    //Some very lightweight input checking
    //if (name === '' || isNaN(price)) {
    //    res.redirect('/products#BadInput');
    //    return;
    //}

    var item = new Proposal({title: title, summary: summary});
    console.log("item: " + item.whatAmI());
    item.save()
      .then(function() {
        res.redirect('/p');
      })
      .catch( curriedHandleError(req, res) );
  },


  showVote: function (req, res) {
    var id = req.param('pid');
    Proposal.findOne({_id: id}).exec()
      .then(function (proposal) {
        var model = {proposal: proposal, item: {}};
        // todo: validation and error message handling
        model.messages = req.flash('error');
        res.render('proposal/vote', model);
      })
      .catch( curriedHandleError(req, res) );
  },

  postVote: function (req, res) {
    if (! req.user) {
      console.error("post vote - not logged in");
      throw new Error("post vote - not logged in");
    }
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
    console.log("userId: " + req.user._id);
    model.userId = req.user._id;

    Vote.create(model)
      .then(function(newItem) {
        console.log("new vote id: " + newItem._id + ", obj: " + newItem);
//        res.redirect('/p/view?id=' + proposalId);
        if (! req.user) {
          console.error("post vote - need to bind supporter");
          res.redirect('/signup?vid=' + item._id);
        } else {
          res.redirect('/vote/view?id=' + newItem._id);
        }
      })
      .catch( curriedHandleError(req, res) );
  },

  voteView: function(req, res) {
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
  },


}
