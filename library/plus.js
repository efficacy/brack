module.exports = function() {
  console.log('defining plus...');
  return function(tail, parser) {
    console.log('calling plus..')
    return parser.resolve(tail.value) + parser.resolve(tail.next.value);
  };
}