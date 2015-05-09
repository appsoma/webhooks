var Actions = function(app) {
  var routeList = {};

  function runCommand( command ) {
    var exec = require('child_process').exec;
    var child = exec( command );
    child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    child.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    child.on('close', function(code) {
        console.log('closing code: ' + code);
    });
  }

  function reset() {
    for (k in app.routes.get) {
      var path = app.routes.get[k].path;
      if( path + "" in routeList) {
        console.log("Removing route "+path);
        app.routes.get.splice(k,1);
      }
    }
  }

  function register(actionList) {
    console.log("Registering...");
    for( var path in actionList ) {
      var command = actionList[path];
      console.log("   "+path+" -> "+command);
      app.get( path, function( req, res, next ) {
        console.log("Handling "+path);
        try {
          console.log("command="+command);
          runCommand(command);
        }
        catch(e) {
          console.log("Error in path "+path+"\n"+JSON.stringify(e,null,2));
        }
      });
    }
  }

  return {
    reset: reset,
    register: register
  }
}

module.exports = Actions;
