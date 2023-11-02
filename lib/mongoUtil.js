// == BSD2 LICENSE ==
// Copyright (c) 2019, Tidepool Project
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

'use strict';

// Pre-condition connectionString is either empty OR is well-formed 
exports.getDatabaseName = function(connectionString, defaultDB) {
  if (connectionString) {
    return connectionString.replace(/^.*\//,'').replace(/\?.*$/, '');
  } else {
    return defaultDB;
  }
};

exports.toConnectionString = function(defaultDB, obj) {
  if (obj == undefined) {
    obj = process.env;
  }

  if (obj.MONGO_CONNECTION_STRING) {
    return obj.MONGO_CONNECTION_STRING;
  }

  var cs;
  var scheme = obj.TIDEPOOL_STORE_SCHEME;
  if (scheme != null && scheme != undefined && scheme != '') {
     cs = scheme;
  } else {
     cs = 'mongodb';
  }
  cs += '://';

  var user = obj.TIDEPOOL_STORE_USERNAME;
  if (user != null && user != undefined && user != '') {
    cs += user;
    var password = obj.TIDEPOOL_STORE_PASSWORD;
    if (password != null) {
      cs += ':';
      cs += password;
    }
    cs += '@';
  }

  var hosts = obj.TIDEPOOL_STORE_ADDRESSES;
  if (hosts != null && hosts != undefined && hosts != '') {
    cs += hosts;
    cs += '/';
  } else {
    cs += 'localhost/';
  }

  var prefix = obj.TIDEPOOL_STORE_DATABASE_PREFIX;
  if (prefix != null && prefix != undefined && database != '') {
    cs += prefix;
  }

  var database = obj.TIDEPOOL_STORE_DATABASE;
  if (database != null && database != undefined && database != '') {
    cs += database;
  } else {
    cs += defaultDB;
  }

  var ssl = obj.TIDEPOOL_STORE_TLS;
  if (ssl != null && ssl != undefined && ssl != '' && ssl.toLowerCase() == 'true') {
    cs += '?ssl=true';
  } else {
    cs += '?ssl=false';
  }

  var optParams = obj.TIDEPOOL_STORE_OPT_PARAMS;
  if (optParams != null && optParams != undefined && optParams != '') {
    cs += '&';
    cs += optParams;
  }
  return cs;
};
