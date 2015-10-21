'use strict';
var express = require('express');
//paypal = require('paypal-rest-sdk'),
var db = require('../lib/database');
var passport = require('passport');
var auth = require('../lib/auth');
var userLib = require('./user')();

// long stack traces, including callbacks.  note, reportedly has performance impact, so should disable for production
//require('longjohn');

module.exports = function spec(app) {
  app.on('middleware:after:session', function configPassport(eventargs) {
    //Tell passport to use our newly created local strategy for authentication
    passport.use(auth.localStrategy());
    //Give passport a way to serialize and deserialize a user. In this case, by the user's id.
    passport.serializeUser(userLib.serialize);
    passport.deserializeUser(userLib.deserialize);
    app.use(passport.initialize());
    app.use(passport.session());
  });

  return {
    onconfig: function (config, next) {

      //configure mongodb and paypal sdk
      db.config(config.get('databaseConfig'));
      //paypal.configure(config.get('paypalConfig'));

      next(null, config);
    }
  };

};
