// == BSD2 LICENSE ==
// Copyright (c) 2014, Tidepool Project
// 
// This program is free software; you can redistribute it and/or modify it under
// the terms of the associated License, which is identical to the BSD 2-Clause
// License as published by the Open Source Initiative at opensource.org.
// 
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the License for more details.
// 
// You should have received a copy of the License along with this program; if
// not, you can obtain one from Tidepool Project at tidepool.org.
// == BSD2 LICENSE ==

var fs = require('fs');
var path = require('path');

var except = require('./except.js');

exports.mkdirsSync = function(dir) {
  if (! fs.existsSync(dir) ) {
    exports.mkdirsSync(path.dirname(dir));
    fs.mkdirSync(dir);
  }
};

exports.rmdirsSync = function(dir) {
  if (fs.existsSync(dir)) {
    var stat = fs.lstatSync(dir);
    if (stat.isDirectory()) {
      fs.readdirSync(dir).forEach(function(subFile) { exports.rmdirsSync(path.join(dir, subFile)) });
      fs.rmdirSync(dir);
    } else if (stat.isFile()) {
      fs.unlinkSync(dir);
    } else {
      throw except.ISE('Unknown file type for path[%s]', dir);
    }
  }
}