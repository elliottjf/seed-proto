'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Proposal = require('../../models/proposal');
var Vote = require('../../models/vote');
var helpers = require('../../lib/helpers');


function handleError(err) {
  console.error(err);
  return helpers.negotiate(req, res, err);
}

module.exports = function (router) {

  router.get('/', function (req, res) {
    Proposal.find().exec()
      .then(function (items) {
        console.log("inside find callback");
        var model = {
          items: items
        };
        res.render('proposal/list', model);
      })
      .catch(handleError)
  });


  router.get('/view', function (req, res) {
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
  });

  router.get('/edit', function (req, res) {
    var model = {item: {id: 1, title: "the first proposal"}};
    res.render('proposal/edit', model);
  });

  router.post('/edit', function (req, res) {
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
  });


  router.get('/vote', function (req, res) {
    var id = req.param('id');
    Proposal.findOne({_id: id}).exec()
      .then(function (proposal) {
        var model = {proposal: proposal, item: {}};
        // todo: validation and error message handling
        model.messages = req.flash('error');
        res.render('proposal/vote', model);
      })
      .catch(handleError)
  });

  router.post('/vote', function (req, res) {
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
  });

};
