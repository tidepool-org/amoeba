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

// expect violates this jshint thing a lot, so we just suppress it
/* jshint expr: true */

'use strict';

var salinity = require('salinity');
var expect = salinity.expect;
var sinon = salinity.sinon;
var mockableObject = salinity.mockableObject;

var gatekeeperClient = mockableObject.make('userInGroup');
var permissions = require('../lib/permissions')(gatekeeperClient);

describe('permissions', function() {

  var res = mockableObject.make('send');
  var callback;

  beforeEach(function() {
    mockableObject.reset(gatekeeperClient);
    mockableObject.reset(res);
    sinon.stub(res, 'send');
    callback = sinon.spy();
  });

  var checksIfValid = function(testFunction) {
    it('sends response status code 401 Unauthorized if token data not present', function() {
      testFunction({params: {userid: 'stranger'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('sends response status code 401 Unauthorized if token data is not server and no user id is specified', function() {
      testFunction({_tokendata: {isserver: false}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('sends response status code 401 Unauthorized if params not present', function() {
      testFunction({_tokendata: {isserver: true, userid: 'stranger'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('sends response status code 401 Unauthorized if params userid not present', function() {
      testFunction({_tokendata: {isserver: true, userid: 'stranger'}, params: {}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });
  };

  var checksIfServer = function(testFunction) {
    it('succeeds if token data is server', function() {
      testFunction({_tokendata: {isserver: true, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
    });
  };

  var checksIfUser = function(testFunction) {
    it('succeeds if user ids match', function() {
      testFunction({_tokendata: {isserver: false, userid: 'user'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
    });
  };

  var checksIfCustodian = function(testFunction) {
    it('sends response status code 400 if error returned from userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {statusCode: 400, message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(400);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('sends response status code 500 if error returned from userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(500);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('sends response status code 401 Unauthorized if userInGroup result is empty', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2);

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });


    it('succeeds if userInGroup result contains custodian', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'custodian': {}});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('sends response status code 401 Unauthorized if userInGroup result does not contain custodian', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });
  };

  var checksIfMembership = function(testFunction) {
    it('sends response status code 400 if error returned from stranger userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {statusCode: 400, message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(400);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('sends response status code 500 if error returned from stranger userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(500);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('succeeds if stranger userInGroup result contains stranger', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('sends response status code 400 if error returned from user userInGroup', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2, {statusCode: 400, message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(400);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });

    it('sends response status code 500 if error returned from user userInGroup', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2, {message: 'error message'});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(500);
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });

    it('succeeds if user userInGroup result contains stranger', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2, null, {'view': {}});

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });

    it('sends response status code 401 Unauthorized if user userInGroup result does not contain stranger', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2);

      testFunction({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });
  };

  it('exists', function() {
    expect(permissions).to.exist;
  });

  describe('successResponse', function() {
    it('sends status code with results', function() {
      permissions.successResponse(200, 'SUCCESS', res, callback);
      expect(res.send).to.have.been.calledWithExactly(200, 'SUCCESS');
      expect(callback).to.have.been.calledWithExactly();
    });
  });

  describe('errorResponse', function() {
    it('returns false if no error', function() {
      expect(permissions.errorResponse(null, res, callback)).to.equal(false);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.not.have.been.called;
    });

    it('sends status code if one specified in error object and returns true if error', function() {
      expect(permissions.errorResponse({statusCode: 400, 'message': 'error'}, res, callback)).to.equal(true);
      expect(res.send).to.have.been.calledWithExactly(400);
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('sends status code 500 if one not specified in error object and returns true if error', function() {
      expect(permissions.errorResponse({'message': 'error'}, res, callback)).to.equal(true);
      expect(res.send).to.have.been.calledWithExactly(500);
      expect(callback).to.have.been.calledWithExactly(false);
    });
  });

  describe('unauthorizedResponse', function() {
    it('sends status code 401', function() {
      permissions.unauthorizedResponse(res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });
  });

  describe('handleResponse', function() {
    it('sends status code if one specified in error object and returns true if error', function() {
      permissions.handleResponse({statusCode: 400, 'message': 'error'}, true, {}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(400);
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('sends status code 500 if one not specified in error object and returns true if error', function() {
      permissions.handleResponse({'message': 'error'}, true, {}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(500);
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('invokes callback if no error, and success', function() {
      permissions.handleResponse(null, true, {}, res, callback);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly();
    });

    it('sends status code 401 if no error, no success, and no fail', function() {
      permissions.handleResponse(null, false, {}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });

    it('invokes fail if no error, no success, and fail', function() {
      var fail = sinon.spy();
      permissions.handleResponse(null, false, {}, res, callback, fail);
      expect(res.send).to.not.have.been.called;
      expect(callback).to.not.have.been.called;
      expect(fail).to.have.been.calledWithExactly({}, res, callback);
    });
  });

  describe('isValidRequest', function() {
    it('returns false if tokendata not specified', function() {
      expect(permissions.isValidRequest({params: {userid: 'stranger'}})).to.equal(false);
    });

    it('returns false if tokendata isserver or userid not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{other: 'other'}, params: {userid: 'stranger'}})).to.equal(false);
    });

    it('returns false if tokendata not isserver or userid not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{isserver: false}, params: {userid: 'stranger'}})).to.equal(false);
    });

    it('returns false if tokendata isserver, but params not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{isserver: true}})).to.equal(false);
    });

    it('returns false if tokendata isserver, but params user id not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{isserver: true}, params: {other: 'other'}})).to.equal(false);
    });

    it('returns true if tokendata isserver and params user id specified', function() {
      expect(permissions.isValidRequest({_tokendata:{isserver: true}, params: {userid: 'stranger'}})).to.equal(true);
    });

    it('returns false if tokendata userid specified, but params not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{userid: 'stranger'}})).to.equal(false);
    });

    it('returns false if tokendata userid specified, but params user id not specified', function() {
      expect(permissions.isValidRequest({_tokendata:{userid: 'stranger'}, params: {other: 'other'}})).to.equal(false);
    });

    it('returns true if tokendata userid specified and params user id specified', function() {
      expect(permissions.isValidRequest({_tokendata:{userid: 'stranger'}, params: {userid: 'stranger'}})).to.equal(true);
    });

    it('returns false if tokendata userid specified and params user id specified with other id key', function() {
      expect(permissions.isValidRequest({_tokendata:{userid: 'stranger'}, params: {userid: 'stranger'}}, 'otherid')).to.equal(false);
    });

    it('returns true if tokendata userid specified and params other id specified with other id key', function() {
      expect(permissions.isValidRequest({_tokendata:{userid: 'stranger'}, params: {otherid: 'stranger'}}, 'otherid')).to.equal(true);
    });
  });

  describe('getPermissions', function() {
    it('calls userInGroup and invokes callback', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});

      permissions.getPermissions('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, {'view': {}});
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });
  });

  describe('hasServerPermissions', function() {
    it('returns false if tokendata isserver is false', function() {
      expect(permissions.hasServerPermissions({_tokendata: {isserver: false}})).to.equal(false);
    });

    it('returns true if tokendata isserver is true', function() {
      expect(permissions.hasServerPermissions({_tokendata: {isserver: true}})).to.equal(true);
    });
  });

  describe('hasUserPermissions', function() {
    it('returns false if tokendata userid does not match params userid', function() {
      expect(permissions.hasUserPermissions('stranger', 'other')).to.equal(false);
    });

    it('returns true if tokendata userid does match params userid', function() {
      expect(permissions.hasUserPermissions('stranger', 'stranger')).to.equal(true);
    });
  });

  describe('hasCheckedPermissions', function() {
    var check = mockableObject.make('check');

    beforeEach(function() {
      mockableObject.reset(check);
    });

    it('invokes callback with error if error returned from userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {message: 'error message'});
      sinon.stub(check, 'check');

      permissions.hasCheckedPermissions('stranger', 'user', check.check, callback);
      expect(check.check).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly({message: 'error message'}, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with false if userInGroup result is empty', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2);
      sinon.stub(check, 'check');

      permissions.hasCheckedPermissions('stranger', 'user', check.check, callback);
      expect(check.check).to.not.have.been.called;
      expect(callback).to.have.been.calledWithExactly(null, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with true if userInGroup result and check returns true', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'custodian': {}});
      sinon.stub(check, 'check').withArgs({'custodian': {}}).returns(true);

      permissions.hasCheckedPermissions('stranger', 'user', check.check, callback);
      expect(check.check).to.have.been.calledWithExactly({'custodian': {}});
      expect(callback).to.have.been.calledWithExactly(null, true);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with false if userInGroup result and check returns true', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});
      sinon.stub(check, 'check').withArgs({'view': {}}).returns(false);

      permissions.hasCheckedPermissions('stranger', 'user', check.check, callback);
      expect(check.check).to.have.been.calledWithExactly({'view': {}});
      expect(callback).to.have.been.calledWithExactly(null, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });
  });

  describe('hasCustodianPermissions', function() {
    it('invokes callback with error if error returned from userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {message: 'error message'});

      permissions.hasCustodianPermissions('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly({message: 'error message'}, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with false if userInGroup result is empty', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2);

      permissions.hasCustodianPermissions('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with true if userInGroup result contains custodian', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'custodian': {}});

      permissions.hasCustodianPermissions('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, true);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with false if userInGroup result does not contain custodian', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});

      permissions.hasCustodianPermissions('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });
  });

  describe('hasMembershipRelationship', function() {
    it('invokes callback with error if error returned from stranger userInGroup', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, {message: 'error message'});

      permissions.hasMembershipRelationship('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly({message: 'error message'}, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with true if stranger userInGroup result contains stranger', function() {
      sinon.stub(gatekeeperClient, 'userInGroup').withArgs('stranger', 'user').callsArgWith(2, null, {'view': {}});

      permissions.hasMembershipRelationship('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, true);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
    });

    it('invokes callback with error if error returned from user userInGroup', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2, {message: 'error message'});

      permissions.hasMembershipRelationship('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly({message: 'error message'}, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });

    it('invokes callback with true if user userInGroup result contains stranger', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2, null, {'view': {}});

      permissions.hasMembershipRelationship('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, true);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });

    it('invokes callback with false if user userInGroup result does not contain stranger', function() {
      var userInGroupStub = sinon.stub(gatekeeperClient, 'userInGroup');
      userInGroupStub.withArgs('stranger', 'user').callsArgWith(2);
      userInGroupStub.withArgs('user', 'stranger').callsArgWith(2);

      permissions.hasMembershipRelationship('stranger', 'user', callback);
      expect(callback).to.have.been.calledWithExactly(null, false);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('stranger', 'user', sinon.match.func);
      expect(gatekeeperClient.userInGroup).to.have.been.calledWithExactly('user', 'stranger', sinon.match.func);
    });
  });

  describe('requireServer', function() {
    checksIfValid(permissions.requireServer);
    checksIfServer(permissions.requireServer);

    it('sends response status code 401 Unauthorized if token data is not server', function() {
      permissions.requireServer({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });
  });

  describe('requireUser', function() {
    checksIfValid(permissions.requireUser);
    checksIfServer(permissions.requireUser);
    checksIfUser(permissions.requireUser);

    it('sends response status code 401 Unauthorized if user ids do not match', function() {
      permissions.requireUser({_tokendata: {isserver: false, userid: 'stranger'}, params: {userid: 'user'}}, res, callback);
      expect(res.send).to.have.been.calledWithExactly(401, 'Unauthorized');
      expect(callback).to.have.been.calledWithExactly(false);
    });
  });

  describe('requireCustodian', function() {
    checksIfValid(permissions.requireCustodian);
    checksIfServer(permissions.requireCustodian);
    checksIfUser(permissions.requireCustodian);
    checksIfCustodian(permissions.requireCustodian);
  });

  describe('requireMembership', function() {
    checksIfValid(permissions.requireMembership);
    checksIfServer(permissions.requireMembership);
    checksIfUser(permissions.requireMembership);
    checksIfMembership(permissions.requireMembership);
  });
});
