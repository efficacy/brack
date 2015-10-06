module.esports = function map(tail, parser) {
  var fn = parser.resolve(tail.value);
  var list = parser.resolve(tail.next);
  var ret = [];
  for (var i = 0; i < list.length; ++i) {
    var result = fn(list[i]. parser);
    if (null != result) ret.push(result);
  }
  return ret;
};
