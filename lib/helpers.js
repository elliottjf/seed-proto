'use strict';


// render appropriate error page for given exception
exports.negotiate = function (req, res, err) {  // derived from sails.js lib/hooks//responses/defaults/negotiate.js
  console.log("inside negotiate - err: " + err + ", res.se: " + res.serverError);
  // Get access to response object (`res`)

  var statusCode = 500;

  try {
    statusCode = err.status || 500;

    // Set the status
    // (should be taken care of by res.* methods, but this sets a default just in case)
    res.status(statusCode);

  } catch (e) {
  }

  var model = {url: req.url, err: err};
  // Respond using the appropriate custom response
  var template = '500';
  if (statusCode === 404) {
    template = '404';
  } else if (statusCode === 503) {
    template = '503';
  } else {
    template = '500';
  }
  res.render('errors/' + template, model);
};

exports.handleError = function(req, res, err) {
  console.error(err);
  return helpers.negotiate(req, res, err);
}

