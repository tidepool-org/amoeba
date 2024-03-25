/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

'use strict';

var axios = require('axios');
var https = require('https');
var nodeUrl = require('url');
var util = require('util');

var _ = require('lodash');

var pre = require('./pre.js');

module.exports = function createHttpClient(config, request) {
  if (config == null) {
    config = {};
  }
  if (request == null) {
    var mapKeys = function(options, keyMap) {
      return _.mapKeys(options, function(_, key) {
        return keyMap[key] || key;
      });
    };
    request = function(options, cb) {
      options = mapKeys(options, {body: 'data', qs: 'params'});
      if (options.auth) {
        options.auth = mapKeys(options.auth, {user: 'username', pass: 'password'});
      }
      axios(options)
        .then(function (res) {
          res = mapKeys(res, {status: 'statusCode', data: 'body'});
          cb(null, res, res.body ? res.body : null);
        })
        .catch(function (err) {
          cb(err);
        });
    };
  }

  pre.defaultProperty(config, 'secureSsl', false);

  var hostDefaultFn;
  if (config.hostGetter == null) {
    hostDefaultFn = function (url, sadCb, happyCb) {
      return happyCb(url);
    };
  } else {
    hostDefaultFn = function (url, sadCb, happyCb) {
      var hostsArray = config.hostGetter.get();
      if (hostsArray.length < 1) {
        process.nextTick(function () { sadCb({ statusCode: 503, message: 'No hosts available' }); });
        return;
      }

      return happyCb(_.assign({}, hostsArray[0], url));
    };
  }

  return {
    withConfigOverrides: function(newConfig) {
      return createHttpClient(_.assign({}, config, newConfig), request);
    },

    requestToPath: function(path) {
      if (arguments.length > 1) {
        path = util.format.apply(util.format, [path].concat(Array.prototype.slice.call(arguments, 1)));
      }
      return this.requestTo({ pathname: path });
    },

    requestTo: function (url) {
      var options = {
        method: 'GET',
        headers: {},
        httpsAgent: new https.Agent({
          rejectUnauthorized: config.secureSsl
        }),
        validateStatus: null,
      };

      var statusHandlers = {};
      var defaultHandler = null;

      return {
        withMethod: function (method) {
          options.method = method;
          return this;
        },
        withHeader: function (header, value) {
          options.headers[header] = value;
          return this;
        },
        withContentType: function(type) {
          return this.withHeader('content-type', type);
        },
        withToken: function (token) {
          return this.withHeader('x-tidepool-session-token', token);
        },
        withBody: function (body) {
          options.body = body;
          return this;
        },
        withJson: function(json) {
          return this.withContentType('application/json').withBody(JSON.stringify(json));
        },
        withQuery: function(queryObj) {
          options.qs = queryObj;
          return this;
        },
        withQueryParameter: function(name, value) {
          if (options.qs == null) {
            options.qs = {};
          }
          options.qs[name] = value;
          return this;
        },
        withAuth: function(username, password) {
          options.auth = { user: username, pass: password };
          return this;
        },

        /**
         * Registers a function to handle a specific response status code.
         *
         * The function provided is in charge of calling the callback and continuing the execution chain
         *
         * @param status either a numeric status code or an array of numeric status codes.
         * @param fn A function(response, body, cb){} to use to extract the value from the response
         * @returns {exports}
         */
        whenStatus: function (status, fn) {
          if (Array.isArray(status)) {
            for (var i = 0; i < status.length; ++i) {
              this.whenStatus(status[i], fn);
            }
            return this;
          }

          statusHandlers[status] = fn;
          return this;
        },

        whenStatusPassBody: function(status) {
          return this.whenStatus(status, function(res, body, cb) {
            cb(null, body);
          });
        },
        whenStatusPassNull: function(status) {
          return this.whenStatus(status, function(res, body, cb) {
            cb(null, null);
          });
        },

        /**
         * Attaches a default handler that will be called if none of the status Handlers match.
         *
         * The normal default handling behavior is to call the callback with an error that looks like
         *
         * { statusCode: res.statusCode, message: body }
         *
         * @param fn A function(res, body, cb){} that will handle non-registered status codes
         * @returns {exports}
         */
        withDefaultHandler: function(fn) {
          defaultHandler = fn;
          return this;
        },

        /**
         * Issues the request and calls the given callback.
         * @param cb An idiomatic function(error, result){} callback
         * @returns {*}
         */
        go: function (cb) {
          hostDefaultFn(
            url,
            cb,
            function(url) {
              options.url = nodeUrl.format(url);
              request(
                options,
                function (err, res, body) {
                  if (err != null) {
                    return cb(err);
                  } else if (statusHandlers[res.statusCode] != null) {
                    return statusHandlers[res.statusCode](res, body, cb);
                  } else {
                    if (defaultHandler != null) {
                      return defaultHandler(res, body, cb);
                    }

                    var retVal = { statusCode: res.statusCode };
                    if (body) {
                      retVal.message = body;
                    }
                    return cb(retVal);
                  }
                }
              );
            }
          );
        }
      };
    }
  };
};