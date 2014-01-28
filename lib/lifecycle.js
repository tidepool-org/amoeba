// == BDS2 LICENSE ==
// Copyright (C) 2014 Tidepool Project
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
// not, you can obtain one at http://tidepool.org/licenses/
// == BDS2 LICENSE ==

var log = require('./log.js')('ameba/lib/lifecycle.js');
var pre = require('./pre.js');

module.exports = function() {
  var objectsToManage = [];
  var started = false;

  return {
    add: function(name, obj) {
      pre.notNull(name, 'Must specify a name');
      pre.notNull(obj, 'Must specify the object to add');

      objectsToManage.push({ name: name, obj: obj });
      if (started) {
        obj.start();
      }
      return obj;
    },
    start: function() {
      started = true;
      for (var i = 0; i < objectsToManage.length; ++i) {
        log.info('Starting obj[%s]', objectsToManage[i].name);
        objectsToManage[i].obj.start();
      }
    },
    close: function() {
      started = false;
      for (var i = 0; i < objectsToManage.length; ++i) {
        try {
          log.info('Closing obj[%s]', objectsToManage[i].name);
          objectsToManage[i].obj.close();
        }
        catch (e) {
          log.error(e, 'Error closing object: ', objectsToManage[i].name);
        }
      }
    },
    join: function() {
      var self = this;

      process.on('uncaughtException', function (err) {
        log.error(err, 'uncaughtException, stopping myself!');
        self.close();
        process.exit(1);
      });
      process.on('SIGINT', process.emit.bind(process, 'SIGTERM'));
      process.on('SIGHUP', process.emit.bind(process, 'SIGTERM'));
      process.on('SIGTERM', function () {
        log.info('Shutting down.');
        self.close();
      });
    }
  };
};