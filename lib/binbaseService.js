'use strict';

var Binbase = require('../models/binbase');
var BinbaseOrg = require('../models/binbaseOrg');

var _ = require('lodash');
_.mixin({
  'inspect': function(value) {
    return require('circular-json').stringify(value);
  }
});

//todo figure out how to leverage kraken config with arbitrary entry point
var databaseConfig = { "host": "localhost", "database": "seedprotokraken" };
var db = require('../lib/database');
db.config(databaseConfig);


function importData() {

  var Transform = require('stream').Transform;
  var csv = require('csv-streamify');
  var csvToJson = csv({objectMode: true, delimiter: ';', newline: '\r\n'});

  var JSONStream = require('JSONStream');
  var jsonToStrings = JSONStream.stringify(false);

  var toBinbase = new Transform({objectMode: true});
  toBinbase._transform = function(data, encoding, done) {
//    console.log('data: ' + _.inspect(data));
    var obj = {
      bin: data[0]
      , cardBrand: data[1]
      , issuingOrg: data[2]
      , cardType: data[3]
      , cardCategory: data[4]
      , countryIso: data[6]
      , orgWebsite: data[9]
      , orgPhone: data[10]
    };
    //var binbase = new Binbase(obj);
    //console.log('binbase: ' + binbase.inspect());
    //binbase.save()
    //  .then(function(result) {
    //    //toBinbase.push(obj);
    //    done();
    //  })
    //  .catch(function(error) {
    //    console.error('error saving: ' + binbase.inspect() + ' - ' + error + ', stack: ' + error.stack);
    //  });

    handleSave(obj, toBinbase, done);
  };

  var filename = process.argv[2] || 'data/test.csv';
//  console.log('argv: ' + _.inspect(process.argv));
  console.log('filename: ' + filename);

  var fs = require('fs');
  var inStream = fs.createReadStream(filename);
  var outStream = fs.createWriteStream('data/import.log');

  // Pipe the streams
//  process.stdin
  inStream
    .pipe(csvToJson)
    .pipe(toBinbase)
    .pipe(jsonToStrings)
    .pipe(outStream);
//    .pipe(process.stdout);

// Some programs like `head` send an error on stdout
// when they don't want any more data
//  process.stdout.on('error', process.exit);

}

function handleSave(data, stream, done) {
  var savedOrg;
  var binbase = new Binbase(data);
  console.log('binbase: ' + binbase); //.inspect());
  BinbaseOrg.findOne({name: data.issuingOrg}).exec()
    .then(function(org) {
//      console.log('found org:' + org);
      if (!org) {
        var orgData = {
          name: data.issuingOrg
          , countryIso: data.countryIso
          , website: data.orgWebsite
          , phone: data.orgPhone
        };
        return BinbaseOrg.create(orgData)
      } else {
        return org
      }
    })
    .then(function(org) {
//      console.log('saved org:' + org ? org.inspect : org);
      savedOrg = org;
      binbase.orgId = org._id;
      return binbase.save()
    })
    .then(function(result) {
      stream.push(result);
//      console.log('save result: ' + result);
      done();
    })
    .catch(function(error) {
      console.error('error saving: ' + binbase.inspect() + ' - ' + error + ', stack: ' + error.stack);
      done();
    });
}



function reimportData() {
  //BinbaseOrg.remove({})
  //  .then(function() {
  //    return Binbase.remove({});
  //  })
  Binbase.remove({})
    .then(function() {
      importData();
    });
}



/** assigns isRegulated for orgs matching the contents given file */
function updateRegulatedBanks() {

  var Transform = require('stream').Transform;
  var csv = require('csv-streamify');
  var csvToJson = csv({objectMode: true, delimiter: ';', newline: '\n'});
  var JSONStream = require('JSONStream');
  var jsonToStrings = JSONStream.stringify(false);

  var bankHandler = new Transform({objectMode: true});
  bankHandler._transform = function(data, encoding, done) {
    console.log('data: ' + _.inspect(data));
    //bankHandler.push(data);
    //done();
    handleRegulatedBank(data, bankHandler, done);
  };

  var filename = process.argv[2] || 'data/regulatedbanks.txt';
//  console.log('argv: ' + _.inspect(process.argv));
  console.log('filename: ' + filename);

  var fs = require('fs');
  var inStream = fs.createReadStream(filename);
  var outStream = fs.createWriteStream('data/updatebank.log');

  // Pipe the streams
//  process.stdin
  inStream
    .pipe(csvToJson)
    .pipe(bankHandler)
    .pipe(jsonToStrings)
    .pipe(outStream);
//    .pipe(process.stdout);

}

function handleRegulatedBank(bankName, stream, done) {
  BinbaseOrg.findOne({name: bankName}).exec()
    .then(function(org) {
      if (org) {
        org.isRegulated = true;
        return org.save();
      } else {
        console.error("binbaseOrg not found: " + bankName);
        return org;
      }
    })
    .then(function(result) {
      stream.push('bank: ' + bankName + ' - ' + _.inspect(result));
      console.log('save result: ' + result);
      done();
    })
    .catch(function(error) {
      console.error('error updating bank: ' + bankName + ' - ' + error + ', stack: ' + error.stack);
      done();
    });
}



//reimportData();
updateRegulatedBanks();


//module.exports = {
//  create: create
//  , update: update
//};
