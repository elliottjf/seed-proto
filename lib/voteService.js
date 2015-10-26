'use strict';

// note, not yet used

var Vote = require('../models/vote');


function create(user, proposal, data, done) {
  data.supporter =
    Vote.create(item, function created(err, newItem) {
      if (err) {

        console.log("err: ", err);
        console.log("err.invalidAttributes: ", err.invalidAttributes);

        // If this is a uniqueness error about the email attribute,
        // send back an easily parseable status code.
        // Otherwise, send back something reasonable as our error response.
        return done(err);
      }
      return done(null, 'ok', newItem);
    });
}

function update(id, data) {

}

module.exports = {
  create: create
  , update: update
};
