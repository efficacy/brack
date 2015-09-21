module.exports = function(tools) {
  return function(list) {
    return tools.resolve(list[0]) + tools.resolve(list[1]);
  };
}