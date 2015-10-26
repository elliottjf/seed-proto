'use strict';

var User = require('../models/user');

var UserLibrary = function () {
  return {
    serialize: function (user, done) {
      done(null, user._id);
    }

    , deserialize: function (id, done) {
      User.findOne({
        _id: id
      }, function (err, user) {
        done(null, user);
      });
    }

    , createUser: function (email, password, name, done) {

      var Passwords = require('machinepack-passwords');

      // Encrypt a string using the BCrypt algorithm.
      Passwords.encryptPassword({
        password: password
        , difficulty: 10
      }).exec({
        // An unexpected error occurred.
        error: function (err) {
          done(err);
        },
        // OK.
        success: function (encryptedPassword) {
          require('machinepack-gravatar').getImageUrl({
            emailAddress: email
          }).exec({
            error: function (err) {
              done(err); //return res.negotiate(err);
            },
            success: function (gravatarUrl) {
              // Create a User with the params sent from
              // the sign-up form --> signup.ejs
              User.create({
                email: email
                , name: name
                , authenticationData: encryptedPassword
                //lastLoggedIn: new Date(),
                //gravatarUrl: gravatarUrl
              }, function userCreated(err, newUser) {
                if (err) {

                  console.log("err: ", err);
                  console.log("err.invalidAttributes: ", err.invalidAttributes)

                  // If this is a uniqueness error about the email attribute,
                  // send back an easily parseable status code.
                  if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0]
                    && err.invalidAttributes.email[0].rule === 'unique') {
                    done(null, 'emailAddressInUse');
                  }

                  // Otherwise, send back something reasonable as our error response.
                  return done(err);
                }
                return done(null, 'ok', newUser);
              });
            }
          });
        }
      });
    },

    // todo, figure out a clever way to adapt machinepack contracts with promise flow
    createUserAsync: function (email, password) {

      return Promise.try(function (email, password) {

        var Passwords = require('machinepack-passwords');

        // Encrypt a string using the BCrypt algorithm.
        Passwords.encryptPassword({
          password: password
          , difficulty: 10
        }).exec({
          // An unexpected error occurred.
          error: function (err) {
            done(err);
          },
          // OK.
          success: function (encryptedPassword) {
            require('machinepack-gravatar').getImageUrl({
              emailAddress: email
            }).exec({
              error: function (err) {
                done(err); //return res.negotiate(err);
              }
              , success: function (gravatarUrl) {
                // Create a User with the params sent from
                // the sign-up form --> signup.ejs
                Promise.promisify(User.create)({
                  email: email
                  , name: name
                  , authenticationData: encryptedPassword
                  //lastLoggedIn: new Date(),
                  //gravatarUrl: gravatarUrl
                }).then(function (newUser) {
                  return newUser;
                }).catch(function (err) {
                  console.log("err: ", err);
                  console.log("err.invalidAttributes: ", err.invalidAttributes);

                  // If this is a uniqueness error about the email attribute,
                  // send back an easily parseable status code.
                  if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0]
                    && err.invalidAttributes.email[0].rule === 'unique') {
                    throw new Error('emailAddressInUse');
                  } else {
                    throw err;
                  }
                });
              }
            });
          }
        });
      });
    }
  };
};

module.exports = UserLibrary;
