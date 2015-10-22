'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var userLib = require('../lib/user')();
var helpers = require('../lib/helpers');

var contributionController = require('./contributionController');

//function handleError(err) {
//  console.error(err);
//  return helpers.negotiate(req, res, err);
//}


function buildMessages(req) {
  var messages = [];
  var pending = req.session.pending
  if ( pending && pending.message && !!pending.message.trim() ) {
    messages.push(pending.message)
  }

  //Include any error messages that come from the login process.
  var flashError = req.flash('error')
  console.log('flashError: [' + flashError + '], const:' + flashError.constructor)
  if (flashError) {
    messages.concat( flashError );
  }
  return messages;
}

module.exports = {

  home: function (req, res) {
    //console.trace("home route stack");
    res.render('index', {});
  }


  /**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  , showLogin: function(req, res) {
    //Include any error messages that come from the login process.
    var model =  {messages: buildMessages(req)};
    res.render('login', model);
  }

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  , postLogin: function(req, res) {
    passport.authenticate('local', {
      successRedirect: '/afterAuth' //req.session.goingTo || '/p',
      , failureRedirect: '/login'
      , failureFlash: true
    })(req, res, function (err) {
      console.log("auth err: " + err);
      res.redirect('/login');
    });
  }


/**
 * handles any needed post login/signup logic
 */
  , afterAuth: function(req, res) {
  if ( ! contributionController.handlePending(req, res) ) {
    res.redirect('/p');
  }
}




/**
   * Display the login page. We also want to display any error messages that result from a failed login attempt.
   */
  , showSignup: function(req, res) {
    var messages = buildMessages(req)
    var model =  {messages: messages};
    res.render('signup', model);
  }

  /**
   * Receive the login credentials and authenticate.
   * Successful authentications will go to /profile or if the user was trying to access a secured resource, the URL
   * that was originally requested.
   *
   * Failed authentications will go back to the login page with a helpful error message to be displayed.
   */
  , postSignup: function(req, res) {
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
            res.redirect('/afterAuth');
          });
        } else {
          console.error("unexpected createUser status: " + status);
          res.redirect('/afterAuth');
        }
      }
    })
  }


  , logout: function(req, res) {
    req.logout();
    res.redirect('/');
  }


}
