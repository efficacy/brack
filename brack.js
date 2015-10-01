/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');
var Cursor = require('./list').Cursor;
var Parser = require('./parser');

var builtin = {
//  primitive: function(context, list) { return require(resolve(list[0], context))({ resolve: resolve }); },
  include: function(tail, parser) { return include(tail, parser); },
  def: function(tail, parser) { return define(tail, parser); },
//  lambda: function(tail) { return lambda(resolve(tail.value), resolve(tail.next.value)); },
//  map: function(context, list) { return map(resolve(list[0], context), tail(list)); },
//  reduce: function(context, list) { return reduce(resolve(list[0], context), tail(list)); },

  echo: function(tail, parser) { return echo(tail, parser); },
  defs: function(tail, parser) { return console.log(util.inspect(symbols[symbols.length-1])); }  
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function define(tail, parser) {
  user[parser.resolve(tail.value)] = parser.resolve(tail.next.value);
  return null;
}

function lambda(args, body) {
  return function(tail, parser) {
    var frame = { parent: symbols[symbols.length-1] };
    var ac = new Cursor(args);
    var tc = new Cursor(tail);
    ac.walk(function(entry) {
      frame[entry.value] = parser.resolve(tc.get());
      tc.forward();
    });
    symbols.push(frame);
    var ret = parser.resolve(body);
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
  var ret = parser.resolve(list[0], context);
  for (var i = 1; i < list.length; ++i) {
    ret = fn([ret, list[i]]);
  }
  return ret;
}

function include(tail, parser) {
  console.log('include at start, context=' + context.dump());
  var fname = parser.resolve(tail.value, context);
  console.log('include(' + fname + '), context=' + context.dump());
  context.cursor.unlink(); // 'overwrite' the include
  console.log('include dropped, context=' + context.dump());
  lex_chunk(fs.readFileSync(fname, {encoding: 'utf8'}), context);
  console.log('include lexed file, context=' + context.dump());
  return context.cursor;
}

function echo(tail, parser) {
  var c = new Cursor(tail);
  var had = false;
  function record(s) {
    if (had) parser.write(' ');
    parser.write(s);
    had = true;
  }
  c.walk(function(link) {
    if (link.value) {
      if (link.value.is_link) {
        if (had) parser.write(' ');
        echo(link.value, parser);
      } else {
        record(parser.resolve(link.value));
      }
    }
  });
  return null;
}

function pr(parser) {
  var parsed = parser.end();
  var c = new Cursor(parsed);
  c.walk(function(entry) {
    var resolved = parser.resolve(entry);
    if (resolved) {
      if (resolved.is_link) {
        parser.write(new Cursor(resolved).dump());
      } else {
        parser.write(''+resolved);
      }
    }
    parser.reset();
  });
}

module.exports = function(script) {
  var ret = '';
  var parser = new Parser(symbols, function(s) { ret += s; });
  parser.chunk(script);
  pr(parser);
  return ret;
}

if (module === require.main) {
  var parser = new Parser(symbols, function(s) { process.stdout.write(''+s); });
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
        pr(parser);
        parser.write('\n');
        rl.prompt();
      }
    });

    rl.on('close', function() {
      pr(parser);
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
      pr(parser);
    });
  }
}
