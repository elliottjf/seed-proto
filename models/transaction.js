'use strict';

/**
 * transaction.js
 *
 * @description :: details specific to financial transactions. owned by Contribution
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var baseModel = require('./baseModel');

var attributes = _.merge({
  profileRef: {type: String, ref: 'Profile'}
  , contributionRef: {type: String, ref: 'Contribution'}
  , date: Date
  , amount: Number  //better fixed precision data type?
  //, paymentSource
  //, params
}, baseModel.baseAttributes);

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.toString = function () {
    return 'Transaction[' + this._id + ', amount: ' + this.amount + ']';
  };

  return mongoose.model('Transaction', schema);

};

module.exports = new modelFactory();
