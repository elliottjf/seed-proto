'use strict';

/**
 * api/base/model.js
 *
 * Base model for all domain models. This just contains some common code that every "nearly" every model uses.
 */

var mongoose = require('mongoose');
var shortid = require('shortid');

//module.exports = {
//  schema: true,

var baseAttributes = {
  _id: {
    type: String,
    unique: true,
    'default': shortid.generate
  },
  createdDate: Date,
  updatedDate: Date,
  // Relation to User object via created user id
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  // Relation to User object via updated user id
  updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

  // Dynamic model data attributes

  // Created timestamp as moment object
  //createdAtObject: function() {
  //  return (this.createdAt && this.createdAt != '0000-00-00 00:00:00')
  //    ? sails.services['date'].convertDateObjectToUtc(this.createdAt) : null;
  //},
  //// Updated timestamp as moment object
  //updatedAtObject: function() {
  //  return (this.updatedAt && this.updatedAt != '0000-00-00 00:00:00')
  //    ? sails.services['date'].convertDateObjectToUtc(this.updatedAt) : null;
  //}
}
//};

exports.baseAttributes = baseAttributes;
