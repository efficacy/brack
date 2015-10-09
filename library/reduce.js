var Cursor = require ('../cursor');
var util = require('util');

module.exports = function reduce(tail, parser) {
  if (!tail || !tail.value || !tail.next) return null;

  var fn = parser.resolve(tail.value);
  if (!fn || 'function' != typeof fn) return null;

  var list = parser.resolve(tail.next);
  if (!list || !list.is_link) return null;

  if (list.value === Cursor.HEAD) list = list.next;
  if (!list || !list.next) return null;

  var acc = parser.resolve(list.value);
  var cc = new Cursor(list.next);
  cc.walk(function(entry) {
    var dummy = new Cursor();
    dummy.insert(acc);
    dummy.insert(parser.resolve(entry.value));
    acc = fn(dummy.head.next, parser);
  });
  return acc;
};
