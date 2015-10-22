'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Proposal = require('../models/proposal');
var Vote = require('../models/vote');
var helpers = require('../lib/helpers');
var handleError = helpers.handleError;


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
      .catch(handleError)
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
      .catch(handleError)
  },

  showEdit: function (req, res) {
    var model = {item: {id: 1, title: "the first proposal"}};
    res.render('proposal/edit', model);
  },

  postEdit: function (req, res) {
    console.log("inside post /edit");
    console.log("body.title: " + req.body.title);
    var title = req.body.title && req.body.title.trim();
    var summary = req.body.summary && req.body.summary.trim();

    //Some very lightweight input checking
    //if (name === '' || isNaN(price)) {
    //    res.redirect('/products#BadInput');
    //    return;
    //}

    console.log("before new proposal");
    var item = new Proposal({title: title, summary: summary});
    console.log("after new proposal");

    console.log("item: " + item.whatAmI());
    item.save()
      .then(function() {
        res.redirect('/p');
      })
      .catch(handleError)
  },


  showVote: function (req, res) {
    var id = req.param('id');
    Proposal.findOne({_id: id}).exec()
      .then(function (proposal) {
        var model = {proposal: proposal, item: {}};
        // todo: validation and error message handling
        model.messages = req.flash('error');
        res.render('proposal/vote', model);
      })
      .catch(handleError)
  },

  postVote: function (req, res) {
    if (! req.user) {
      console.error("post vote - not logged in");
      throw new Error("post vote - not logged in");
    }
    var model = {};
    model.voteRank = req.param('voteRank');
    model.contributionPledge = req.param('contributionPledge');
    model.patronagePledge = req.param('patronagePledge');
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
        res.redirect('/vote/view?id=' + newItem._id);
      })
      .catch(handleError)
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
      .catch(handleError)
  },


}
