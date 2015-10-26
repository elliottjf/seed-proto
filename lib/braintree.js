'use strict';

var _ = require('lodash');
var braintree = require("braintree");

var theBraintree;
var theGateway;
var theConfig;

_.mixin({
  'inspect': function(value) {
    return require('circular-json').stringify(value);
  }
});


function configure(config) {
  theConfig = config;
  console.log('braintree config: ' + _.inspect(config));

  theBraintree = braintree;

  theGateway = braintree.connect({
    environment: braintree.Environment.Sandbox
    , merchantId: config.merchantId
    , publicKey: config.publicKey
    , privateKey: config.privateKey
  });
  console.log('theGateway: ' + _.inspect(theGateway));

}

function instance() {
  return theGateway;
}

module.exports = {
  configure: configure
  , instance: instance
};


