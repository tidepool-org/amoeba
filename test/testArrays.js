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

var arrays = require('../lib/arrays.js');

describe('arrays.js', function(){
  describe('randomize', function(){
    it('returns an empty list if given an empty list', function(){
      var array = [];
      expect(arrays.randomize(array, 1)).is.empty;
    });

    it('returns the number of elements asked for', function(){
      var array = [1, 2, 3, 4];
      expect(arrays.randomize(array, 1)).length(1);
      expect(arrays.randomize(array, 2)).length(2);
      expect(arrays.randomize(array, 3)).length(3);
      expect(arrays.randomize(array, 4)).length(4);
    });

    it('returns all elements if asked for length', function(){
      var array = [1, 2, 3, 4];
      var retVal = arrays.randomize(array, 4);

      expect(retVal).to.include.members(array);
      expect(retVal.sort()).to.deep.equal(array);
    });

    it('returns all elements, once, if asked for more than length', function(){
      var array = [1, 2, 3, 4];
      var retVal = arrays.randomize(array, 1902309184);

      expect(retVal).to.include.members(array);
      expect(retVal.sort()).to.deep.equal(array);
    });
  });
});