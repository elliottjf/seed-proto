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
  //todo: figure out how to make mongoose relationships work with the short ids
  supporter: {type: mongoose.Schema.Types.ObjectId, ref: 'Profile'}
  , proposal: {type: mongoose.Schema.Types.ObjectId, ref: 'Proposal'}
  , userId: String
  , supporterId: String
  , proposalId: String
  , voteRank: Number
  , anticipatedCapital: Number
  , anticipatedPatronage: Number
  , pledgedCapital: Number
  , pledgedPatronage: Number
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
