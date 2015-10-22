'use strict';


var home = require('./homeController');
var proposal = require('./proposalController');
var contribution = require('./contributionController');



module.exports = function (router) {

  home.addRoutes(router);
  proposal.addRoutes(router);
  contribution.addRoutes(router);

};
