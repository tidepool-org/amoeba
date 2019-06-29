/*
 == BSD2 LICENSE ==
 Copyright (c) 2016, Tidepool Project

 This program is free software; you can redistribute it and/or modify it under
 the terms of the associated License, which is identical to the BSD 2-Clause
 License as published by the Open Source Initiative at opensource.org.

 This program is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE. See the License for more details.

 You should have received a copy of the License along with this program; if
 not, you can obtain one from Tidepool Project at tidepool.org.
 == BSD2 LICENSE ==
 */

'use strict';

var _ = require('lodash');

module.exports = function(gatekeeperClient) {

  var successResponse = function(code, results, res, next) {
    res.status(code);
    res.send(results);
    return next();
  };

  var errorResponse = function(error, res, next) {
    if (error == null) {
      return false;
    }
    res.status(error.statusCode || 500);
    res.send();
    return true;
  };

  var unauthorizedResponse = function(res, next) {
    res.status(401);
    res.send('Unauthorized');
    return next(false);
  };

  var handleResponse = function(error, success, req, res, next, fail) {
    if (!errorResponse(error, res, next)) {
      if (!success) {
        if (fail) {
          return fail(req, res, next);
        }
        return unauthorizedResponse(res, next);
      }
      return next();
    } else {
      return next(false);
    }
  };

  var isValidRequest = function(req, idKey) {
    return (req._tokendata != null) && 
           (req._tokendata.isserver || !_.isEmpty(req._tokendata.userid)) && 
           (req.params != null) &&
           !_.isEmpty(req.params[idKey || 'userid']);
  };

  var getPermissions = function(tokenUserId, requestUserId, callback) {
    gatekeeperClient.userInGroup(tokenUserId, requestUserId, callback);
  };

  var hasServerPermissions = function(req) {
    return req._tokendata.isserver;
  };

  var hasUserPermissions = function(tokenUserId, requestUserId) {
    return tokenUserId === requestUserId; 
  };

  var hasCheckedPermissions = function(tokenUserId, requestUserId, check, callback) {
    getPermissions(tokenUserId, requestUserId, function(error, result) {
      if (error != null) {
        return callback(error, false);
      } 
      if (!_.isEmpty(result)) {
        return callback(null, check(result));
      }
      return callback(null, false);
    });
  };

  var hasCustodianPermissions = function(tokenUserId, requestUserId, callback) {
    hasCheckedPermissions(tokenUserId, requestUserId, function(result) {
      return result.custodian != null;
    }, callback);
  };

  var hasMembershipRelationship = function(tokenUserId, requestUserId, callback) {
    getPermissions(tokenUserId, requestUserId, function(error, result) {
      if (error != null) {
        return callback(error, false);
      } 
      if (!_.isEmpty(result)) {
        return callback(null, true);
      }

      getPermissions(requestUserId, tokenUserId, function(error, result) {
        if (error != null) {
          return callback(error, false);
        } 
        if (!_.isEmpty(result)) {
          return callback(null, true);
        }
        return callback(null, false);
      });
    });
  };

  var requireServer = function(req, res, next, fail) {
    if (!isValidRequest(req)) {
      return unauthorizedResponse(res, next);
    }
    if (hasServerPermissions(req)) {
      return next();
    }
    if (fail) {
      return fail(req, res, next);
    }
    return unauthorizedResponse(res, next);
  };

  var requireUser = function(req, res, next, fail) {
    requireServer(req, res, next, function(req, res, next) {
      if (hasUserPermissions(req._tokendata.userid, req.params.userid)) {
        return next();
      }
      if (fail) {
        return fail(req, res, next);
      }
      return unauthorizedResponse(res, next);
    });
  };

  var requireCustodian = function(req, res, next, fail) {
    requireUser(req, res, next, function(req, res, next) {
      hasCustodianPermissions(req._tokendata.userid, req.params.userid, function(error, success) {
        handleResponse(error, success, req, res, next, fail);
      });
    });
  };

  var requireMembership = function(req, res, next, fail) {
    requireUser(req, res, next, function(req, res, next) {
      hasMembershipRelationship(req._tokendata.userid, req.params.userid, function(error, success) {
        handleResponse(error, success, req, res, next, fail);
      });
    });
  };

  return {
    successResponse: successResponse,
    errorResponse: errorResponse,
    unauthorizedResponse: unauthorizedResponse,
    handleResponse: handleResponse,
    isValidRequest: isValidRequest,
    getPermissions: getPermissions,
    hasServerPermissions: hasServerPermissions,
    hasUserPermissions: hasUserPermissions,
    hasCheckedPermissions: hasCheckedPermissions,
    hasCustodianPermissions: hasCustodianPermissions,
    hasMembershipRelationship: hasMembershipRelationship,
    requireServer: requireServer,
    requireUser: requireUser,
    requireCustodian: requireCustodian,
    requireMembership: requireMembership
  };
};
