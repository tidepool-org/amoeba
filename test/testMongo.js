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

// expect violates this jshint thing a lot, so we just suppress it
/* jshint expr: true */

'use strict';

var expect = require('salinity').expect;

var cs = require('../lib/mongo.js').toConnectionString;

describe('mongo.js', function(){
    it('returns simple connection string with no args', function() {
      expect(cs('foo')).to.deep.equal('mongodb://localhost/foo?ssl=false');
    });

    it('returns simple connection string with USER', function() {
      var obj={ MONGO_USER: 'derrick'};
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick@localhost/foo?ssl=false');
    });

    it('returns simple connection string with USER and PASSWORD', function() {
      var obj={ MONGO_USER: 'derrick', MONGO_PASSWORD: 'password'};
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=false');
    });

    it('returns simple connection string with USER and PASSWORD and ssl', function() {
      var obj={ MONGO_USER: 'derrick', MONGO_PASSWORD: 'password', MONGO_SSL: 'True'};
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=true');
    });

    it('returns simple connection string with USER and PASSWORD and ssl and optparams', function() {
      var obj={ MONGO_USER: 'derrick', MONGO_PASSWORD: 'password', MONGO_SSL: 'True', MONGO_OPT_PARAMS: 'x=y'};
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=true&x=y');
    });
});
