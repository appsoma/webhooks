module.exports = function (port) {

  var express = require('express');
  var app = express();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser')

  app.port = port;
  app.locals.title = 'Appsoma Webhooks';
  app.locals.email = 'ken@appsoma.com';
  app.use( bodyParser.json({limit: '1mb'}) );

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

   function History(requestsToKeep) {
     var fifo = [];
     var data = {};

     function add(uid,req,res) {
       fifo.push(uid);
       data[uid] = {
         req: req,
         res: null
       }
       if( fifo.length > requestsToKeep ) {
         var killUid = fifo.shift();
         delete data[killUid];
       }
     }

     function get(uid,field) {
       console.log('fetching '+uid);
       if( !data[uid] ) {
         return '';
       }
       return data[uid].req[field];
     }

     return {
       add: add,
       get: get
     }
   };

   var history = History(1000);

  //
  // Middleware to emit the REST calls out
  // to all listeners on the websocket...
  //
  var webhook_uid = 0;

  app.use(function(req, res, next) {
    webhook_uid += 1;
    req.webhook_uid = webhook_uid;
    history.add( webhook_uid, req, null );

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

  app.get( '/request/:uid/header', function( req, res ) {
    console.log('query='+JSON.stringify(req.query));
    var uid = req.params.uid;
    res.send( history.get(uid,'headers') );
  });

  app.get( '/request/:uid/query', function( req, res ) {
    var uid = req.params.uid;
    res.send( history.get(uid,'query') );
  });

  app.get( '/request/:uid/body', function( req, res ) {
    var uid = req.params.uid;
    res.send( history.get(uid,'body') );
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
