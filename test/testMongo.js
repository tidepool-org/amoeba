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

var cs = require('../lib/mongoUtil.js').toConnectionString;
var getDatabaseName = require('../lib/mongoUtil.js').getDatabaseName;

describe('mongo.js', function(){
    it('returns default database name on empty string', function() {
      expect(getDatabaseName('','foo')).to.deep.equal('foo');
    });

    it('extractss database from uri', function() {
      expect(getDatabaseName('mongodb+srv://derrick:password@mongodb1,mongodb2/bar?ssl=true&x=y','foo')).to.deep.equal('bar');
    });

    it('returns simple connection string with no args', function() {
      expect(cs('foo')).to.deep.equal('mongodb://localhost/foo?ssl=false');
    });

    it('returns simple connection string with provided database', function() {
      var obj={
	     TIDEPOOL_STORE_DATABASE: 'bar'
      };
      expect(cs('foo',obj)).to.deep.equal('mongodb://localhost/bar?ssl=false');
    });

    it('returns simple connection string with USER', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick@localhost/foo?ssl=false');
    });

    it('returns simple connection string with USER and PASSWORD', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick',
	     TIDEPOOL_STORE_PASSWORD: 'password'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=false');
    });

    it('returns simple connection string with USER and PASSWORD and ssl', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick',
	     TIDEPOOL_STORE_PASSWORD: 'password',
	     TIDEPOOL_STORE_TLS: 'True'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=true');
    });

    it('returns simple connection string with USER and PASSWORD and ssl and optparams', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick',
	     TIDEPOOL_STORE_PASSWORD: 'password',
	     TIDEPOOL_STORE_TLS: 'True',  
             TIDEPOOL_STORE_OPT_PARAMS: 'x=y'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@localhost/foo?ssl=true&x=y');
    });

    it('returns simple connection string with USER and PASSWORD and ssl and optparams and hosts', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick',
	     TIDEPOOL_STORE_PASSWORD: 'password',
	     TIDEPOOL_STORE_TLS: 'True',  
             TIDEPOOL_STORE_OPT_PARAMS: 'x=y',
             TIDEPOOL_STORE_ADDRESSES: 'mongodb1,mongodb2'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb://derrick:password@mongodb1,mongodb2/foo?ssl=true&x=y');
    });

    it('returns simple connection string with USER and PASSWORD and ssl and optparams and hosts and scheme', function() {
      var obj={
	     TIDEPOOL_STORE_USERNAME: 'derrick',
	     TIDEPOOL_STORE_PASSWORD: 'password',
	     TIDEPOOL_STORE_TLS: 'True',  
             TIDEPOOL_STORE_OPT_PARAMS: 'x=y',
             TIDEPOOL_STORE_ADDRESSES: 'mongodb1,mongodb2',
             TIDEPOOL_STORE_SCHEME: 'mongodb+srv'
      };
      expect(cs('foo', obj)).to.deep.equal('mongodb+srv://derrick:password@mongodb1,mongodb2/foo?ssl=true&x=y');
    });
});
