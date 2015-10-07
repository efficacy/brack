var Cursor = require ('../cursor');

module.exports = function map(tail, parser) {
  if (!tail || !tail.value) return null;

  var fn = parser.resolve(tail.value);
  if (!fn) return null;

  var list = parser.resolve(tail.next);
  if (!list) return null;
  
  var ret = null;
  if (list.is_link) {
    var c = new Cursor(list);
    var dest = new Cursor();
    c.walk(function(entry) {
      var arg = new Cursor();
      arg.insert(entry.value);
      var result = fn(arg.head.next, parser);
      if (null != result) dest.insert(result);
    });
    ret = dest.head.next ? dest.head : null;
  } else {
    ret = fn(list);
  } 

  return ret;
};
