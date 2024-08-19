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

var expect = require('salinity').expect;

var base32Hex = require('../index.js').base32hex;

describe('encodeBuffer', function(){
  describe('test vectors from rfc 4648', function(){
    function run(str) {
      return expect(base32Hex.encodeBuffer(Buffer.from(str)));
    }

    it('BASE32-HEX("") = ""', function(){
      run('').equals('');
    });

    it('BASE32-HEX("f") = "CO======"', function(){
      run('f').equals('co======');
    });

    it('BASE32-HEX("fo") = "CPNG===="', function(){
      run('fo').equals('cpng====');
    });

    it('BASE32-HEX("foo") = "CPNMU==="', function(){
      run('foo').equals('cpnmu===');
    });

    it('BASE32-HEX("foob") = "CPNMUOG="', function(){
      run('foob').equals('cpnmuog=');
    });

    it('BASE32-HEX("fooba") = "CPNMUOJ1"', function(){
      run('fooba').equals('cpnmuoj1');
    });

    it('BASE32-HEX("foobar") = "CPNMUOJ1E8======"', function(){
      run('foobar').equals('cpnmuoj1e8======');
    });
  });

  describe('test padding override', function(){
    function run(str, pad) {
      return expect(base32Hex.encodeBuffer(Buffer.from(str), {paddingChar: pad}));
    }

    it('pads with a hypen instead', function(){
      run('foobar', '-').equals('cpnmuoj1e8------');
    });
  });
});
