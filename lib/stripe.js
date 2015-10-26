'use strict';

var theStripe;
var theConfig;

function configure(config) {
  theConfig = config;
  var secretKey = config.secretKey;
  console.log('secretKey: ' +  secretKey);
  theStripe = require("stripe")(secretKey);
}

function instance() {
  return theStripe;
}

function config() {
  return theConfig;
}

module.exports = {
  configure: configure
  , instance: instance
  , config: config
};

