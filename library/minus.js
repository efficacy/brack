module.exports = function(tools) {
  return function(list) {
    return tools.execute(list[0]) - tools.execute(list[1]);
  };
}