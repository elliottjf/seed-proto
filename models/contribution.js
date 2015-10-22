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

var attributes = _.merge(baseModel.baseAttributes, {
  supporter: {type: mongoose.Schema.Types.ObjectId, ref: 'Profile'},
  proposal: {type: mongoose.Schema.Types.ObjectId, ref: 'Proposal'},
  description: String,
  amount: Number,  //better fixed precision data type?
});

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.whatAmI = function () {
    return 'Contribution[' + this._id + ', amount: ' + this.amount + ']';
  };

  return mongoose.model('Contribution', schema);

};

module.exports = new modelFactory();