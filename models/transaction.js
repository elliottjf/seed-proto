'use strict';

/**
 * transaction.js
 *
 * @description :: details specific to financial transactions. owned by Contribution
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var baseModel = require('./baseModel');

var attributes = _.merge(baseModel.baseAttributes, {
  contribution: {type: mongoose.Schema.Types.ObjectId, ref: 'Contribution'},
  date: Date,
  amount: Number,  //better fixed precision data type?
  //paymentSource,
  //params,
});

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.whatAmI = function () {
    return 'Transaction[' + this._id + ', amount: ' + this.amount + ']';
  };

  return mongoose.model('Transaction', schema);

};

module.exports = new modelFactory();