/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');

var builtin = {
  primitive: function(context, list) { return require(resolve(list[0], context))({ resolve: resolve }); },
  include: function(context, list) { return include(resolve(list[0], context), context); },
  def: function(context, list) { user[resolve(list[0], context)] = resolve(list[1], context); },
  lambda: function(context, list) { return lambda(list[0], list[1], context); },
  map: function(context, list) { return map(resolve(list[0], context), tail(list)); },
  reduce: function(context, list) { return reduce(resolve(list[0], context), tail(list)); },

  echo: function(context, list) { echo(list, context); },
  dump: function(context, list) { console.log(util.inspect(symbols[symbols.length-1])); },
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function lookup(name) {
  for(var dict = symbols[symbols.length-1]; dict; dict = dict.parent) {
    if (dict[name]) return dict[name];
  }
  return null;
}

function tail(list, n) { return list.slice(n||1); }

function lambda(args, body, context) {
  return function(context, list) {
    var frame = { parent: symbols[symbols.length-1] };
    for (var i = 0; i < args.length; ++i) {
      frame[args[i]] = resolve(list[i]);
    };
    symbols.push(frame);
    var ret = resolve(body, context);
    symbols.pop();
    return ret;
  };
}

function map(context, fn, list) {
  var ret = [];
  for (var i = 0; i < list.length; ++i) {
    var result = fn(context, list[i]);
    if (null != result) ret.push(result);
  }
  return ret;
}

function reduce(context, fn, list) {
  var ret = resolve(list[0], context);
  for (var i = 1; i < list.length; ++i) {
    ret = fn([ret, list[i]]);
  }
  return ret;
}

function include(fname, context) {
  context.stack.push(context.current);
  context.current = [];
  lex_chunk(fs.readFileSync(fname, {encoding: 'utf8'}), context);
  var value = resolve(context.current, context);
  context.current = context.stack.pop();
  context.current.pop(); //'overwrite' the include
  context.current.push(value);
  return context.current;
}

function echo(s, context) {
  if (null == s || 'function' === typeof(s)) return;
  if (Array.isArray(s)) {
    var n = s.length;
    for (var i = 0; i < n; ++i) {
      var value = resolve(s[i], context);
      if (null != value) {
        if (i > 0) echo (' ', context);
        echo(value, context);
      }
    }
  } else {
    context.writer(s);
  }
}

function evaluate(s, context) {
  if (null == s) return null;
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return lookup(s) || s;
}

function resolve(list, context) {
  if (!Array.isArray(list)) return evaluate(list, context);

  var key = resolve(list[0]);
  if ('function' !== typeof(key)) return list;

  var ret = key(context, list.slice(1));
  return ret;
}

function category(c) {
  if (c === '(') return 'open';
  if (c === ')') return 'close';
  if (c === "'") return 'sq';
  if (c === '"') return 'dq';
  if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') return 'ws';
  return 'letter';
}

function new_context(writer) { return { buf: '', status: 'outside', stack: [], current: [], writer: writer }; }

function lex_chunk(s, context) {
  function token(type) {
    var value = '' + context.buf;
    context.buf = '';
    context.status = 'outside';
    parser({type: type, value: value}, context);
  }

  var n = s.length;
  for (var i = 0; i < n; ++i) {
    var c = s[i];
    var cc = category(c);

    switch(cc) {
    case 'ws':
      if (context.status == 'sq' || context.status == 'dq') context.buf += c;
      if (context.status == 'symbol') token('symbol');
      break;
    case 'letter':
      context.buf += c;
      if (context.status == 'outside') context.status = 'symbol';
      break;
    case 'sq':
    case 'dq':
      context.buf += c;
      if (context.status == 'outside') {
        context.status = cc;
      } else if (context.status == cc) {
        token('symbol');
      } 
      break;
    case 'open':
    case 'close':
      if (context.status == 'symbol') token('symbol');
      if (context.status == 'sq' || context.status == 'dq') {
        context.buf += c;
      } else {
        token(cc);
      }
      break;
    }
  }
}

function lex_end(context) {
  lex_chunk('\n', context);
  var n = context.current.length;
  for (var i = 0; i < n; ++i) {
    var value = resolve(context.current[i], context);
    if (null != value) context.writer(value);
  }
}

function record(value, context) {
  if (context.immediate && context.stack.length == 0) {
    echo(resolve(value, context), context);
    echo('\n', context);
  } else {
    context.current.push(value);
  }
}

function parser(token, context) {
  switch(token.type) {
  case 'open':
    context.stack.push(context.current);
    context.current = [];
    break;
  case 'symbol':
    record(token.value, context);
    break;
  case 'close':
    var value = context.current;
    context.current = context.stack.pop();
    record(value, context);
    break;
  }
}

module.exports = function(script) {
  var out = '';
  var context = new_context(function(s) { out += s; });
  lex_chunk(script + '\n', context);
  lex_end(context);
  return out;
}

module.exports.resolve = resolve;

if (module === require.main) {
  var context = new_context(function(s) { process.stdout.write(s.toString()); });
  context.immediate = process.stdout.isTTY;

  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      lex_chunk(chunk, context);
    }
  });

  process.stdin.on('end', function() {
    lex_end(context);
    process.stdout.write('\n');
  });
}
