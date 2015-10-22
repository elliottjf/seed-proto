'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var passport = require('passport');
var LoginModel = require('../models/login');
var userLib = require('../lib/user')();
var helpers = require('../lib/helpers');


//function handleError(err) {
//  console.error(err);
//  return helpers.negotiate(req, res, err);
//}


module.exports = {

  home: function (req, res) {
    //console.trace("home route stack");
    res.render('index', {});
  },


  /**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  showLogin: function(req, res) {
    var model = new LoginModel();
    //Include any error messages that come from the login process.
    model.messages = req.flash('error');
    res.render('login', model);
  },

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  postLogin: function(req, res) {
    passport.authenticate('local', {
      successRedirect: req.session.goingTo || '/p',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, function (err) {
      console.log("auth err: " + err);
      res.redirect('/login');
    });
  },


  /**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  showSignup: function(req, res) {
    var model = new LoginModel();
    //Include any error messages that come from the login process.
    model.messages = req.flash('error');
    res.render('signup', model);
  },

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  postSignup: function(req, res) {
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
  },


  logout: function(req, res) {
    req.logout();
    res.redirect('/');
  },


}
