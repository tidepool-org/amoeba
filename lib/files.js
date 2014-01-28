var fs = require('fs');
var path = require('path');

exports.mkdirsSync = function(dir) {
  if (! fs.existsSync(dir) ) {
    exports.mkdirsSync(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}