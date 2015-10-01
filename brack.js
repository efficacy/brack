/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');
var Cursor = require('./list').Cursor;
var Parser = require('./parser');

var builtin = {
//  primitive: function(context, list) { return require(resolve(list[0], context))({ resolve: resolve }); },
  include: function(tail, context) { include(tail, context); },
  def: function(tail, context) { user[resolve(tail, context)] = resolve(tail.next, context); },
//  lambda: function(context, list) { return lambda(list[0], list[1], context); },
//  map: function(context, list) { return map(resolve(list[0], context), tail(list)); },
//  reduce: function(context, list) { return reduce(resolve(list[0], context), tail(list)); },

  echo: function(tail, context) { echo(tail, context); }
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function lookup(name) {
  for(var dict = symbols[symbols.length-1]; dict; dict = dict.parent) {
    if (dict[name]) return dict[name];
  }
  return name;
}

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

function include(tail, context) {
  console.log('include at start, context=' + context.dump());
  var fname = resolve(tail.value, context);
  console.log('include(' + fname + '), context=' + context.dump());
  context.cursor.unlink(); // 'overwrite' the include
  console.log('include dropped, context=' + context.dump());
  lex_chunk(fs.readFileSync(fname, {encoding: 'utf8'}), context);
  console.log('include lexed file, context=' + context.dump());
  return context.cursor;
}

function echo(tail) {
  console.log('echo: tail=' + new Cursor(tail).dump());
  var ret = '';
  var c = new Cursor(tail);
  var had = false;
  function record(s) {
    if (had) ret += ' ';
    ret += s;
    had = true;
  }
  c.walk(function(link) {
    if (link.value) {
      if (had) context.writer(' ');
      if (link.value.is_link) {
        echo(link.value, context);
      } else {
        ret += link.value;
      }
    }
  });
  console.log(ret);
}

function resolve(value) {
//  console.log('resolve link=' + util.inspect(link));
//  if (link=='hello') throw new Error('who called?');
  if (null == value) return null;
  if ('string' == typeof value) return lookup(value);
  if (!value.is_link) return value;
  var head = resolve(value.value);
  var tail = value.next;

  var ret;
  if ('function' === typeof(head)) {
    console.log('resolve head is a function');
    return head(tail);
  }
  return value;
}

module.exports = function(script) {
  var parser = new Parser();
  parser.chunk(script);
  var parsed = parser.end();
  return new Cursor(parsed).dump();
}

if (module === require.main) {
  var parser = new Parser();
  process.stdin.setEncoding('utf8');

  if (process.stdin.isTTY) {
    var readline = require('readline');

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log('Brack 0.8 Interacive');
    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', function(chunk) {
      if (null != chunk) {
        parser.chunk(chunk);
        var parsed = parser.end();
        console.log('parsed: ' + typeof parsed);
        var resolved = resolve(parsed);
        parser.reset();
        console.log('resolved: ' + new Cursor(resolved).dump());
        rl.prompt();
      }
    });

    rl.on('close', function() {
      var parsed = parser.end();
      parser.reset();
      console.log(new Cursor(parsed).dump());
      process.exit();
    });
  } else {
    process.stdin.on('readable', function() {
      var chunk = process.stdin.read();
      if (null != chunk) {
        parser.chunk(chunk);
      }
    });

    process.stdin.on('end', function() {
      var parsed = parser.end();
      process.stdout.write(new Cursor(parsed).dump());
    });
  }
}
