// == BSD2 LICENSE ==

var fixture = require('./fixture.js');
var expect = fixture.expect;

var arrays = require('../lib/arrays.js');

describe('arrays.js', function(){
  describe('randomize', function(){
    it("returns an empty list if given an empty list", function(){
      var array = [];
      expect(arrays.randomize(array, 1)).is.empty;
    });

    it("returns the number of elements asked for", function(){
      var array = [1, 2, 3, 4];
      expect(arrays.randomize(array, 1)).length(1);
      expect(arrays.randomize(array, 2)).length(2);
      expect(arrays.randomize(array, 3)).length(3);
      expect(arrays.randomize(array, 4)).length(4);
    });

    it("returns all elements if asked for length", function(){
      var array = [1, 2, 3, 4];
      var retVal = arrays.randomize(array, 4);

      expect(retVal).to.include.members(array);
      expect(retVal.sort()).to.deep.equal(array);
    });

    it("returns all elements, once, if asked for more than length", function(){
      var array = [1, 2, 3, 4];
      var retVal = arrays.randomize(array, 1902309184);

      expect(retVal).to.include.members(array);
      expect(retVal.sort()).to.deep.equal(array);
    });
  });
});