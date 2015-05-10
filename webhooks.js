var webhooks = require('./index');

var argList = process.argv.slice(2);

if( argList[0] == '-h' ) {
  console.log("Usage:\nnode webhooks.js [port|7788]\nDetails at github.com/appsoma/webhooks");
  process.exit(1);
}

var port = argList[0] || 7788;
webhooks(port);
