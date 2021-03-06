/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');

var Cursor = require('./cursor');
var Parser = require('./parser');

var builtin = {
  primitive: primitive,
  def: def,
  lambda: lambda,
  include: include,
  echo: echo
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function primitive (tail, parser) {
  return require(parser.resolve(tail.value));
}

function def(tail, parser) {
  var name = parser.resolve(tail.value);
  var value =  parser.resolve(tail.next);
  if (value) {
    user[name] = value.is_link ? value.value : value;
  }
  return null;
}

function lambda(tail, parser) {
  var args = tail.value.next;
  var body = tail.next;
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

function include(tail, parser) {
  var fname = parser.resolve(tail);
  var p = new Parser(parser.symbols, parser.write);
  p.chunk(fs.readFileSync(fname, {encoding: 'utf8'}));
  var parsed = p.end();
  var c = new Cursor(parsed);
  return parsed;
}

function echo(tail, parser) {
  var had = false;
  function record(s) {
    if (had) parser.write(' ');
    parser.write(s);
    had = true;
  }
  if (tail) {
    if (!tail.is_link) {
      record(parser.resolve(tail));
    } else {
      var c = new Cursor(tail);
      c.walk(function(link) {
        if (had) parser.write(' ');
        echo(parser.resolve(link.value), parser);
        had = true;
      });
    }
  }
  return null;
}

function pr(parser) {
  var parsed = parser.end();
  var c = new Cursor(parsed);
  c.walk(function(entry) {
    var resolved = parser.resolve(entry.value);
    if (resolved) {
      if (resolved.is_link) {
        parser.write(new Cursor(resolved).dump());
      } else {
        parser.write(''+resolved);
      }
    }
  });
  parser.reset();
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
