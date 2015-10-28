'use strict';

var _ = require('lodash');

var theService;
var theConfig;

//_.mixin({
//  'inspect': function(value) {
//    return require('circular-json').stringify(value);
//  }
//});


function configure(config) {
  theConfig = config;
  console.log('authorize.net config: ' + _.inspect(config));

  theService = require('node-authorize-net')(config.apiLoginId, config.transactionKey);
}

function instance() {
  return theService;
}

function config() {
  return theConfig;
}


module.exports = {
  configure: configure
  , instance: instance
  , config: config
};


