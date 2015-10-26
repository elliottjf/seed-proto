'use strict';

/**
 * binbase.js
 *
 * @description :: credit card 6 digit prefix (bin) database
 * licensed from http://binbase.com
 */

var _ = require('lodash');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var baseModel = require('./baseModel');


var attributes = {
  bin: String  // i.e. 447707
  , cardBrand: String  // i.e. VISA
  , issuingOrg: String  // i.e. ARTISANS' BANK
  , cardType: String    // i.e. DEBIT, CREDIT, CHARGE CARD
  , cardCategory: String  // i.e. CLASSIC, GOLD
  , countryIso: String   // i.e. US
  , orgWebsite: String  // i.e. HTTP://WWW.ARTISANSBANK.COM
  , orgPhone: String   // i.e. 302-658-6881
  , orgId: String      // todo sort out propertly relation refs
};

var modelFactory = function () {

  var schema = mongoose.Schema(attributes);

  schema.methods.toString = function () {
    return 'Binbase[' + this.bin + ', org: ' + this.issuingOrg + ', type: ' + this.cardType + ', category: ' + this.cardCategory + ']';
  };

  return mongoose.model('Binbase', schema);

};

module.exports = new modelFactory();
