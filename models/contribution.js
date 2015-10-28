'use strict';

/**
 * contribution.js
 *
 * @description :: includes pledges, monetary and non-monetary support given. owned by Campaign, references Profile.
 * can be one-time or recurring. (should this also capture a supporters membership status?)
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var baseModel = require('./baseModel');

var attributes = _.merge({
  profileRef: {type: String, ref: 'Profile'}
  , proposalRef: {type: String, ref: 'Proposal'}
  //, userRef: String
  //, userName: String  //denormalized for now
  //, supporterId: String
  //, proposalId: String
  , description: String
  //better fixed precision data type?
  , pledgedCapital: Number
  , pledgedPatronage: Number
  , paidCapital: Number
  , paidPatronage: Number
}, baseModel.baseAttributes);

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.toString = function () {
    return 'Contribution[' + this._id + ', amount: ' + this.amount + ']';
  };

  return mongoose.model('Contribution', schema);

};

module.exports = new modelFactory();
