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

var expect = require('salinity').expect;

describe('polling.js', function(){

  describe('repeat()', function(){
    it("should run immediately and repeat", function(done){
      var polling = require('../lib/polling.js');

      var count = 0;
      var changeMe = 'hi';
      polling.repeat(
        "test",
        function(cb){
          if (count === 0) {
            expect(changeMe).equals('hi');
            count = 1;
            cb();
          }
          else if (count === 1) {
            expect(changeMe).equals('done');
            count = 2;
            cb();
          }
          else if (count === 2) {
            cb('stop');
            done();
          }
        },
        1,
        false
      );
      changeMe = 'done';
    });
  });

  describe('repeatAfterDelay()', function(){
    it("should run after a delay and repeat", function(done){
      var polling = require('../lib/polling.js');

      var count = 0;
      var changeMe = 'hi';
      polling.repeatAfterDelay(
        "test",
        function(cb){
          if (count === 0) {
            expect(changeMe).equals('done');
            count = 1;
            cb();
          }
          else if (count === 1) {
            count = 2;
            cb();
          }
          else if (count === 2) {
            cb('stop');
            done();
          }
        },
        1,
        false
      );
      changeMe = 'done';
    });
  });
});