'use strict';

var mongoose = require('mongoose');
var Proposal = require('../../models/proposal');
var Vote = require('../../models/vote');
var helpers = require('../../lib/helpers');


module.exports = function (router) {

  router.get('/', function (req, res) {
    try {
      Proposal.find(function (err, items) {
        console.log("inside find callback");
        if (err) {
          console.log(err);
          res.render("errors/500", {err: err})
        } else {
          //items.forEach(function(item) {
          //    item.prettyPrice = item.prettyPrice();
          //});
          var model = {
            items: items
          };
          res.render('proposal/list', model);
        }
      });
    } catch (e) {
      console.error("caught: " + e);
      res.render("errors/500", {err: e})
    }

  });


  router.get('/view', function (req, res) {
    //var model = {item: {id:1,title:"the first proposal"}};
    //res.render('proposal/view', model);
    var id = req.param('id');
    Proposal.findOne({_id: id}, function (err, item) {
      if (err) {
        console.log(err);
        res.render("errors/500", {err: err})
      }
      //items.forEach(function(item) {
      //    item.prettyPrice = item.prettyPrice();
      //});
      Vote.find({proposalId: item._id}, function (err, votes) {
        var model = {
          item: item,
          votes: votes
        };
        res.render('proposal/view', model);

      })
    });

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

    //Show it in console for educational purposes...
    item.whatAmI();
    console.log("item: " + item.whatAmI());
    /* The call back recieves to more arguments ->product/s that is/are added to the database
     and number of rows that are affected because of save, which right now are ignored
     only errors object is consumed*/
    item.save(function (err) {
      if (err) {
        console.log('save error', err);
        res.render("errors/500", {err: e})

      } else {
        res.redirect('/p');
      }
    });


  });


  router.get('/vote', function (req, res) {
    var id = req.param('id');
    Proposal.findOne({_id: id}, function (err, proposal) {
      if (err) {
        console.log(err);
        res.render("errors/500", {err: err})
      }
      var model = {proposal: proposal, item: {} };
      //Include any error messages that come from the login process.
      model.messages = req.flash('error');
      res.render('proposal/vote', model);

    });


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

    Vote.create(model, function (err, newItem) {
      if (err) {
        console.error(err);
        return helpers.negotiate(req, res, err);
      } else {
        console.log("new vote id: " + newItem._id + ", obj: " + newItem);
//        res.redirect('/p/view?id=' + proposalId);
        res.redirect('/vote/view?id=' + newItem._id);
      }
    });
  });




};
