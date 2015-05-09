var Config = function(fileName,onConfigFn,millisecondsToDelayReload) {
  var fs = require('fs');
  var reloadTimer = null;
  var config = {};
  millisecondsToDelayReload = millisecondsToDelayReload || 250;

  function load() {
    try {
      console.log("Loading "+fileName);
      config = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }
    catch(e) {
      console.log(JSON.stringify(e.message));
      console.log("Create a \""+fileName+"\" file to configure actions.");
    }

    onConfigFn(config);
  }

  fs.watch(fileName, function (event, filename) {
    console.log("waiting "+millisecondsToDelayReload+" to reload "+fileName+' (event=' + event+')');
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(load,millisecondsToDelayReload);
    load();
  });

  load();

  return {
    load: load
  }
}

module.exports = Config;
