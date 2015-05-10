var Actions = function(app,onResponse) {
  var routeList = {};

  function runCommand( command, environment, onStdout, onStderr, onComplete ) {
    var exec = require('child_process').exec;

    var child = exec( command, {env: environment} );
    child.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
      if( onStdout ) {
        onStdout(data);
      }
    });
    child.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
      if( onStderr ) {
        onStderr(data);
      }
    });
    child.on('close', function(code) {
      console.log('complete: ' + code);
      if( onComplete ) {
        onComplete(code);
      }
    });
  }

  function create(route,action) {
    if( typeof action == 'string' ) {
      action = {
        command: action
      }
    }
    var parts = route.split(' ',2);
    //console.log("became "+JSON.stringify(parts));
    action.method = parts[0];
    action.path = parts[1];
    routeList[action.method+' '+action.path] = true;
    console.log("   "+action.method+' '+action.path+" -> "+action.command);

    //
    // Here is the actual function that sends a response. Or not.
    //
    app[action.method]( action.path, function( req, res, next ) {

      // Don't respond to routes that don't exist in the config any more.
      if( !routeList[action.method+' '+action.path] ) {
        res.status(404);
        return;
      }

      var environment = {};
      environment['webhook_url'] = "localhost:"+app.port
      environment['webhook_uid'] = req.webhook_uid;
      environment['webhook_path'] = action.path;
      environment['webhook_command'] = action.command;
      environment['webhook_headers'] = JSON.stringify(req.headers);
      environment['webhook_query'] = JSON.stringify(req.query);
      environment['webhook_body'] = JSON.stringify(req.body);
      for( var k in req.query ) {
        environment['webhook_'+k] = req.query[k];
      }

      console.log("Handling "+action.path);
      try {
        console.log("command="+action.command);
        var result = {
          uid: -1,
          stdout: '',
          stderr: '',
          exitCode: -1
        }

        runCommand(
          action.command,
          environment,
          !action.respond ? null : function(data) {
            result.stdout += data;
          },
          !action.respond ? null : function(data) {
            result.stderr += data;
          },
          !action.respond ? null : function(exitCode) {
            result.uid = req.webhook_uid;
            result.exitCode = exitCode;
            res.send(result);
            if( onResponse ) {
              onResponse(result);
            }
          }
        );
        if( !action.respond ) {
          res.send("OK");
        }
        else {
          return false;
        }
      }
      catch(e) {
        console.log("Error "+action.path+" running "+action.command+"\n"+JSON.stringify(e,null,2));
      }
    });
  }


  function register(actionList) {
    routeList = {};
    console.log("Registering...");
    for( var route in actionList ) {
      create(route,actionList[route]);
    }
  }

  return {
    register: register
  }
}

module.exports = Actions;
