module.exports = function (port) {

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
  var webhook_uid = 0;

  app.use(function(req, res, next) {
    webhook_uid += 1;
    req.webhook_uid = webhook_uid;
    try {
      console.log('%s %s', req.url, JSON.stringify(req.query,null,2));
    }
    catch(e) {
      console.log(e.message);
    }
    try {
      io.emit('webhook', { uid: webhook_uid, action: req.url, params: req.query });
    }
    catch(e) {
      console.log(e.message);
    }
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

  // Only called when the action has respond: true
  function onResponse(result) {
    try {
      io.emit('response', result);
    }
    catch(e) {}
  }


  var actions = require('./actions')(app,onResponse);

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
