var WebhooksServer = function (port) {

  // For reference, here are other nodejs file manipulation tools:
  // Wrench - for recursive file manipulation  https://www.npmjs.com/package/wrench
  // ncp - recursive async file copy  https://www.npmjs.com/package/ncp

  var express = require('express');
  var app = express();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser')

  app.locals.title = 'Webhooks';
  app.locals.email = 'ken@appsoma.com';
  app.use( bodyParser.json({limit: '50mb'}) );

  var configFileName = ".webhooks-config.json";
  var config = JSON.parse(fs.readFileSync(configFileName, 'utf8'));

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/issue', function( req, res ) {
    res.redirect('https://github.com/appsoma/webhooks/issues/new/');
  });

  app.get('/list', function (req, res) {
    var s = '';
    var routes = app._router.stack;
    for( var i=0 ; i<routes.length ; ++i ) {
      var r = routes[i];
      if( !r.route || !r.route.path ) {
        continue;
      }
      s += "<div>"+(r.route.methods.get ? "GET" : "POST") + " " + r.route.path + "</div>"
    }
    res.send(s);
  });

  app.get( '/parrot/push', function(req, res, next) {
    console.log("testing");
    console.log(JSON.stringify(req.query));
//    var gmail = require("gmailer");
  });

  // intercept all and then send...
  io.emit('some event', { for: 'everyone' });

  io.on('connection', function(socket) {

    console.log('user connected');

    socket.on('disconnect', function() {
      console.log('user disconnected');
    });

    socket.on('data', function(msg) {
      // This is a publish only websocket, so ignore
    });

  });

  http.listen(port, function() {
    console.log('Webhooks listening on *:'+port);
  });

}

var argList = process.argv.slice(2);

if( argList[0] == '-h' ) {
  console.log("Usage:\nnode webhooks.js [port|7788]\nDetails at github.com/appsoma/webhooks");
  process.exit(1);
}

var port = argList[0] || 7788;
WebhooksServer(port);
