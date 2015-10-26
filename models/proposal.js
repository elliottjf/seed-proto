'use strict';

/**
 * proposal.js
 *
 * @description :: represents either produce/sesrvice sector proposal, a specific enterprise, other kind of fund raising campaign
 */

var _ = require('lodash');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var baseModel = require('./baseModel');


var attributes = _.merge({
  title: String
  , summary: String
}, baseModel.baseAttributes);

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.toString = function () {
    return 'Proposal[' + this._id + ', title: ' + this.title + ']';
  };

  //schema.methods.prettyPrice = function () {
  //    return (this && this.price) ? '$' + this.price.toFixed(2) : '$';
  //};

  return mongoose.model('Proposal', schema);

};

module.exports = new modelFactory();
