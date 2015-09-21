module.exports = function(tools) {
  return function(context, list) {
    return tools.resolve(list[0], context) + tools.resolve(list[1], context);
  };
}