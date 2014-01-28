// == BSD2 LICENSE ==

var expect = require('./fixture.js').expect;

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
          console.log('Hi!');
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