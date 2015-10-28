'use strict';


exports.startServer = function(port, path, callback) {

  var app = require('./index');
  var http = require('http');


  // console.log(`APP:#{app}`)

  /*
   * Create and start HTTP server.
   */



  var server = http.createServer(app);
  server.listen(port);
  server.on('listening', function() {
    console.log('Server listening on http://localhost:%d', this.address().port);
    callback();
  });


}
