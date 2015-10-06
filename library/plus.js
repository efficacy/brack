module.exports = function(tail, parser) {
  return parser.resolve(tail.value) + parser.resolve(tail.next.value);
};
