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

  app.locals.title = 'Appsoma Webhooks';
  app.locals.email = 'ken@appsoma.com';
  app.use( bodyParser.json({limit: '50mb'}) );

  // Try to make exceptions more visible...
  if (app.get('env') === 'development') {
      app.use(function(err, req, res, next) {
          res.status(err.status || 500);
          res.render('error', {
              message: err.message,
              error: err
          });
       });
   }

  //
  // Middleware to emit the REST calls out
  // to all listeners on the websocket...
  //
  app.use(function(req, res, next) {
    try {
      console.log('%s %s', req.url, JSON.stringify(req.query,null,2));
    }
    catch(e) {}
    try {
      io.emit('webhook', { action: req.url, params: req.query });
    }
    catch(e) {}
    console.log("next");
    next();
  });

  app.get('/', function( req, res ){
    var indexFile = __dirname + '/index.html';
    console.log('sending '+indexFile);
    res.sendFile(indexFile);
  });

  app.get('/issue', function( req, res ) {
    res.redirect('https://github.com/appsoma/webhooks/issues/new/');
  });

  app.get('/list', function ( req, res ) {
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

  app.get( '/parrot/push', function( req, res ) {
    console.log("in parrot push");
//    var gmail = require("gmailer");
    res.send('ack');
  });

  var userCount = 0;

  io.on('connection', function(socket) {
    function countUsers(delta) {
      userCount += delta;
      console.log(userCount + ' user'+(userCount>1?'s':'')+' connected');
    }
    countUsers(1);

    socket.on('disconnect', function() {
      countUsers(-1);
    });

    socket.on('data', function(msg) {
      // This is a publish only websocket, so ignore
    });

  });

  var actions = require('./actions')(app);

  var config = require('./config');
  config(
    "webhooks-config.json",
    function(config) {
      if( config.actions ) {
        actions.register(config.actions);
      }
    }
  );

  // Remember that any code after this will not be run,
  // because listen() blocks.
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
