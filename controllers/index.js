'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var passport = require('passport');
var IndexModel = require('../models/index');
var LoginModel = require('../models/login');
var userLib = require('../lib/user')();
var helpers = require('../lib/helpers');
var Vote = require('../models/vote');


function handleError(err) {
  console.error(err);
  return helpers.negotiate(req, res, err);
}


function passthrough(router, path) {
  router.get('/' + path, function (req, res) {
    res.render(path, {});
  });
}

module.exports = function (router) {

  var model = new IndexModel();
  var dummyModel = {};

  router.get('/', function (req, res) {
    //console.trace("home route stack");
    res.render('index', model);
  });

  passthrough(router, 'how_it_works');
  passthrough(router, 'who_we_are');


  /**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  router.get('/login', function (req, res) {
    var model = new LoginModel();
    //Include any error messages that come from the login process.
    model.messages = req.flash('error');
    res.render('login', model);
  });

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  router.post('/login', function (req, res) {
    passport.authenticate('local', {
      successRedirect: req.session.goingTo || '/p',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, function (err) {
      console.log("auth err: " + err);
      res.redirect('/login');
    });
  });


  /**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  router.get('/signup', function (req, res) {
    var model = new LoginModel();
    //Include any error messages that come from the login process.
    model.messages = req.flash('error');
    res.render('signup', model);
  });

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  router.post('/signup', function (req, res) {
    var email = req.param('email');
    var password = req.param('password');
    userLib.createUser(email, password, function (err, status, newUser) {
      if (err) {
        return helpers.negotiate(req, res, err);
      } else {
        if ('emailAddressInUse' === status) {
          return res.emailAddressInUse();
        } else if (newUser) {
          req.login(newUser, function (err) {
            if (err) {
              console.error(err);
            }
            res.redirect('/p');
          });
        } else {
          console.error("unexpected createUser status: " + status);
          res.redirect('/p');
        }
      }
    })
  });


  router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });


  router.get('/vote/view', function (req, res) {
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
  });



};
