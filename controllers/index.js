'use strict';


var home = require('./homeController');
var proposal = require('./proposalController');
var contribution = require('./contributionController');



function passthrough(router, path) {
  router.get('/' + path, function (req, res) {
    res.render(path, {});
  });
}

module.exports = function (router) {

  router.get('/', home.home);
  passthrough(router, 'how_it_works');
  passthrough(router, 'who_we_are');

  router.get('/login', home.showLogin);
  router.post('/login', home.postLogin);
  router.get('/signup', home.showSignup);
  router.post('/signup', home.postSignup);
  router.get('/afterAuth', home.afterAuth);
  router.get('/logout', home.logout);

  router.get('/p', proposal.list);
  router.get('/p/view', proposal.view);
  router.get('/p/edit', proposal.showEdit);
  router.post('/p/edit', proposal.postEdit);
  router.get('/p/vote', proposal.showVote);
  router.post('/p/vote', proposal.postVote);
  router.get('/vote/view', proposal.voteView);

  contribution.addRoutes(router);

};
