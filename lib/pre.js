// == BSD2 LICENSE ==

var util = require('util');

var except = require('./except.js');

exports.notNull = function(val, message) 
{
  if (val == null) {
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 2)));
  }
  return val;
};

exports.hasProperty = function(obj, property, message)
{
  if (obj == null) {
    throw except.IAE('Supposed to check for property[%s] on obj, but obj[%s] no exist!', property, obj);
  }
  if (obj[property] == null) {
    if (message == null) {
      message = util.format('property[%s] must be specified on object[%j]', property, obj);
    }
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 3)));
  }
  return obj[property];
};

exports.defaultProperty = function(obj, property, val)
{
  if (obj == null) {
    obj = {};
  }
  if (obj[property] == null) {
    obj[property] = val;
  }
  return obj;
};

var typeOfHandlers = {
  array: function(val) {
    return Array.isArray(val);
  }
};

exports.isType = function(val, type, message) {
  var handler = typeOfHandlers[type];
  if (handler == null) {
    handler = function(arg){ return typeof(arg) === type; };
  }

  if (! handler(val)) {
    if (message == null) {
      message = util.format('Expected object of type[%s], got [%s]', type, typeof(val));
    }
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 3)));
  }
  return val;
};