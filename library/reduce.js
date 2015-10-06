module.exports = function reduce(tail, parser) {
  var fn = parser.resolve(tail.value);
  var list = parser.resolve(tail.next);
  var ret = parser.resolve(list.value);
  var cc = new Cursor(ret);
  cc.walk(function(entry) {
    var dummy = new Cursor();
    dummy.insert(ret);
    dummy.insert(entry.value);
    ret = fn(dummy.next, parser);
  });
  return ret;
};
