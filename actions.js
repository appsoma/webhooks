var Actions = function(app,onResponse) {
  var routeList = {};

  function runCommand( command, onStdout, onStderr, onComplete ) {
    var exec = require('child_process').exec;
    var child = exec( command );
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

  function register(actionList) {
    routeList = {};
    console.log("Registering...");
    for( var path in actionList ) {
      routeList[path] = true;
      var action = actionList[path];
      if( typeof action == 'string' ) {
        action = {
          command: action
        }
      }
      action.path = path;
      console.log("   "+action.path+" -> "+action.command);

      //
      // Here is the actual function that sends a response. Or not.
      //
      app.get( action.path, function( req, res, next ) {
        if( !routeList[action.path] ) {
          res.status(404);
          return;
        }

        console.log("Handling "+action.path);
        try {
          console.log("command="+action.command);
          var result = {
            stdout: '',
            stderr: '',
            exitCode: -1
          }

          runCommand(
            action.command,
            !action.respond ? null : function(data) {
              result.stdout += data;
            },
            !action.respond ? null : function(data) {
              result.stderr += data;
            },
            !action.respond ? null : function(exitCode) {
              result.uid = req.uid;
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
          console.log("Error in path "+path+"\n"+JSON.stringify(e,null,2));
        }
      });
    }
  }

  return {
    register: register
  }
}

module.exports = Actions;
