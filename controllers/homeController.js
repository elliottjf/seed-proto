'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var userLib = require('../lib/user')();
var helpers = require('../lib/helpers');
var passthrough = helpers.passthrough;

var contributionController = require('./contributionController');
var proposalController = require('./proposalController');

//function handleError(err) {
//  console.error(err);
//  return helpers.negotiate(req, res, err);
//}


function buildMessages(req) {
  var messages = [];
  var pending = req.session.pending;
  if ( pending && pending.message && !!pending.message.trim() ) {
    messages.push(pending.message);
  }

  //Include any error messages that come from the login process.
  var flashError = req.flash('error');
  console.log('flashError: [' + flashError + '], const:' + flashError.constructor);
  if (flashError) {
    messages.concat( flashError );
  }
  return messages;
}

function home(req, res) {
  //console.trace("home route stack");
  res.render('index', {})
}


/**
 * Display the login page. We also want to display any error messages that result from a failed login attempt.
 */
function showLogin(req, res) {
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
function postLogin(req, res) {
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
function afterAuth(req, res) {
  if (proposalController.handlePending(req, res)) {
    return
  }
  if (contributionController.handlePending(req, res)) {
    return
  }
  res.redirect('/p');
}



/**
 * Display the login page. We also want to display any error messages that result from a failed login attempt.
 */
function showSignup(req, res) {
  var messages = buildMessages(req);
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
function postSignup(req, res) {
  var email = req.param('email');
  var password = req.param('password');
  userLib.createUser(email, password, function (err, status, newUser) {
    if (err) {
      return helpers.negotiate(req, res, err);
    } else {
      if ('emailAddressInUse' === status) {
        return res.emailAddressInUse()
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


function logout(req, res) {
  req.logout();
  res.redirect('/');
}

//function passthrough(router, path) {
//  router.get('/' + path, function (req, res) {
//    res.render(path, {});
//  });
//}


function addRoutes(router) {
  router.get('/', home);
  passthrough(router, 'how_it_works');
  passthrough(router, 'who_we_are');
  router.get('/login', showLogin);
  router.post('/login', postLogin);
  router.get('/signup', showSignup);
  router.post('/signup', postSignup);
  router.get('/afterAuth', afterAuth);
  router.get('/logout', logout)
}


module.exports = {
  addRoutes: addRoutes
//  , handlePending: handlePending
};

