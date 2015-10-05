/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');
var Cursor = require('./list').Cursor;
var Parser = require('./parser');

var builtin = {
  primitive: function(tail, parser) { return primitive(tail, parser); },
  include: function(tail, parser) { return include(tail, parser); },
  def: function(tail, parser) { return define(tail, parser); },
  lambda: function(tail, parser) { return lambda(tail, parser); },
//  map: function(context, list) { return map(resolve(list[0], context), tail(list)); },
//  reduce: function(context, list) { return reduce(resolve(list[0], context), tail(list)); },

  echo: function(tail, parser) { return echo(tail, parser); },
  defs: function(tail, parser) { return console.log(util.inspect(symbols[symbols.length-1])); }  
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function primitive(tail, parser) {
  var name = parser.resolve(tail.value);
  return require(name)();
};

function define(tail, parser) {
  var name = parser.resolve(tail.value);
  var value =  parser.resolve(tail.next);
  console.log('define name=' + name + ' value=' + Parser.describe(value));
  if (value) {
    user[name] = value.is_link ? value.value : value;
  }
  return null;
}

function lambda(tail, parser) {
  var args = tail.value.next;
  var body = tail.next;
  return function(tail, parser) {
    console.log('lambda function args=' + Parser.describe(args) + ' tail=' + Parser.describe(tail) + ' body=' + Parser.describe(body));
    var frame = { parent: symbols[symbols.length-1] };
    var ac = new Cursor(args);
    var tc = new Cursor(tail);
    ac.walk(function(entry) {
      frame[entry.value] = parser.resolve(tc.get());
      tc.forward();
    });
    symbols.push(frame);
    console.log('lambda frame=' + util.inspect(symbols[symbols.length-1]));
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
  console.log('include at start, tail=' + Parser.describe(tail) + ', tree=' + parser.dump());
  var fname = parser.resolve(tail);
  console.log('include(' + fname + ')');
  var p = new Parser(parser.symbols, parser.write);
  p.chunk(fs.readFileSync(fname, {encoding: 'utf8'}));
  var parsed = p.end();
  var c = new Cursor(parsed);
  console.log('about to include ' + Parser.describe(parsed));
  console.log('include at end, tree=' + parser.dump());
  return parsed;
}

function echo(tail, parser) {
  console.log('echo tail=' + Parser.describe(tail));
  var had = false;
  function record(s) {
    if (had) parser.write(' ');
    console.log('echo writing ' + util.inspect(s));
    parser.write(s);
    had = true;
  }
  if (tail) {
    if (!tail.is_link) {
      record(parser.resolve(tail));
    } else {
      console.log('echo tail is a link');
      var c = new Cursor(tail);
      c.walk(function(link) {
        console.log('echo walking, got ' + Parser.describe(link));
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
  console.log('about to process ' + Parser.describe(parsed));
  c.walk(function(entry) {
    console.log('pr entry=' + Parser.describe(entry));
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
  console.log('parsing[' + script + ']');
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
