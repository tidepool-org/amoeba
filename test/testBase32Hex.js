var expect = require('salinity').expect;

var base32Hex = require('../index.js').base32Hex;

describe('encodeBuffer', function(){
  describe('test vectors from rfc 4648', function(){
    function run(str) {
      return expect(base32Hex.encodeBuffer(new Buffer(str)));
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
      return expect(base32Hex.encodeBuffer(new Buffer(str), {paddingChar: pad}));
    }

    it('pads with a hypen instead', function(){
      run('foobar', '-').equals('cpnmuoj1e8------');
    })
  });
});