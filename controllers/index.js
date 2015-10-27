'use strict';


var home = require('./homeController');
var proposal = require('./proposalController');
var contribution = require('./contributionController');
var payment = require('./paymentController');



module.exports = function (router) {

  home.addRoutes(router);
  proposal.addRoutes(router);
  contribution.addRoutes(router);
  payment.addRoutes(router);

};
