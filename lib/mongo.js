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

exports.toConnectionString = function(defaultDB) {
  cs = "mongodb://"
  user = process.env['MONGO_USER']
  if (user != null) {
    cs += user
    password = process.env['MONGO_PASSWORD']
    if (password != null) {
      cs += ":"
      cs += password
    }
    cs += "@"
  }

  hosts = process.env['MONGO_HOSTS']
  if (hosts != null) {
    cs += hosts
    cs += "/"
  } else {
    cs += "localhost/"
  }

  database = process.env['MONGO_DATABASE']
  if (database != null) {
    cs += database
  } else {
    cs += defaultDB
  }

  ssl = process.env['MONGO_SSL']
  if (ssl != null && ssl.toLowerCase() == "true") {
    cs += "?ssl=true"
  } else {
    cs += "?ssl=false"
  }
  optParams = process.env['MONGO_OPT_PARAMS']
  if (optParams != null) {
    cs += "&"
    cs += optParams
  }
  return cs
}
