'use strict';

/**
 * vote.js
 *
 * @description :: votes or pledges of support for a given proposal or campaign
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var baseModel = require('./baseModel');

var attributes = _.merge({
  profileRef: {type: String, ref: 'Profile'}
  , proposalRef: {type: String, ref: 'Proposal'}
  //, userId: String
  //, userName: String  //denormalized for now
  //, supporterId: String
  //, proposalId: String
  , voteRank: Number
  , anticipatedCapital: Number
  , anticipatedPatronage: Number
  //, pledgedCapital: Number
  //, pledgedPatronage: Number
  , workerInterest: String
}, baseModel.baseAttributes);

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.toSTring = function () {
    return 'Vote[' + this._id + ', voteRank: ' + this.voteRank + ']';
  };

  return mongoose.model('Vote', schema);

};

module.exports = new modelFactory();
