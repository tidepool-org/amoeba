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

exports.toConnectionString = function(defaultDB, obj) {
  if (obj == null) {
    obj = process.env;
  }
  var cs = 'mongodb://';
  var user = obj.MONGO_USER;
  if (user != null) {
    cs += user;
    var password = obj.MONGO_PASSWORD;
    if (password != null) {
      cs += ':';
      cs += password;
    }
    cs += '@';
  }

  var hosts = obj.MONGO_HOSTS;
  if (hosts != null) {
    cs += hosts;
    cs += '/';
  } else {
    cs += 'localhost/';
  }

  var database = obj.MONGO_DATABASE;
  if (database != null) {
    cs += database;
  } else {
    cs += defaultDB;
  }

  var ssl = obj.MONGO_SSL;
  if (ssl != null && ssl.toLowerCase() == 'true') {
    cs += '?ssl=true';
  } else {
    cs += '?ssl=false';
  }

  var optParams = obj.MONGO_OPT_PARAMS;
  if (optParams != null) {
    cs += '&';
    cs += optParams;
  }
  return cs;
};
