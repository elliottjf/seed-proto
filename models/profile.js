'use strict';

/**
 * profile.js
 *
 * @description ::  public profile information, could be individual or organization. represents both entities benefiting
 * from the campaign as well as supporters (in fact same entity can be both).  will eventually probably need a
 * UserProfileRelation model capturing role and access levels
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var baseModel = require('./baseModel');

var attributes = _.merge({
  name: String,
  email: String,
  phone: String,
  address: String,
  about: String,
  taxId: String
}, baseModel.baseAttributes);

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.whatAmI = function () {
    return 'Profile[' + this._id + ', name: ' + this.name + ']';
  };

  return mongoose.model('Profile', schema);

};

module.exports = new modelFactory();
