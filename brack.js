/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');
var Cursor = require('./list').Cursor;

var builtin = {
//  primitive: function(context, list) { return require(resolve(list[0], context))({ resolve: resolve }); },
  include: function(tail, context) { include(tail, context); },
//  def: function(context, list) { user[resolve(list[0], context)] = resolve(list[1], context); },
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

function include(tail, context) {
  var fname = resolve(tail.value, context);
  console.log('include(' + fname + '), context=' + context.dump());
  var here = context.cursor.link; 
  context.push();
  console.log('include pushed, context=' + context.dump());
  lex_chunk(fs.readFileSync(fname, {encoding: 'utf8'}), context);
  console.log('include lexed file, context=' + context.dump());
  var value = resolve(context.current, context);
  console.log('include resolved, value=' + util.inspect(value));
  context.pop();
  console.log('include popped, context=' + context.dump());
  new Cursor(here).unlink();
  console.log('include dropped, context=' + context.dump());
  return context.current;
}

function echo(tail, context) {
  console.log('echo: tail=' + new Cursor(tail).dump());
  var c = new Cursor(tail);
  var had = false;
  function record(s) {
    if (had) context.writer(' ');
    context.writer(s);
    had = true;
  }
  c.walk(function(link) {
    if (link.value) {
      if (link.value.is_link) {
        if (had) context.writer(' ');
        echo(link.value, context);
      } else {
        record(evaluate(link.value, context));
      }
    }
  });

  c.walk(function(entry) { var val = resolve(entry.value, context); if (null != val) context.writer(val); })
}

function evaluate(s, context) {
  if (null == s) return null;
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return lookup(s) || s;
}

function resolve(link, context) {
  if (null == link) return null;
  if (!link.is_link) return evaluate(link);
  if (!link.value.is_link) return evaluate(link.value, context);

  var key = resolve(link.value.value, context);
  if ('function' !== typeof(key)) return link.value;

  var ret = key(link.value.next, context);
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

function new_context(writer) {
  var cursor = new Cursor();
  var root = cursor.insert(null);
  return {
    buf: '',
    status: 'outside',
    root: root,
    cursor: cursor,
    writer: writer,

    push: function push() {
      this.cursor.push();
    },
    pop: function pop() {
      this.cursor.pop();
    },
    drop: function drop() {
      var current = this.cursor.link; 
      this.cursor.unlink();
      if (this.root === current) {
        this.root = current.next;
      }
    },
    record: function record(value) {
      if (null == value) return;
      console.log('record ' + value);
      if (this.immediate && this.cursor.up == null) {
        echo(resolve(value, this), this);
        echo('\n', this);
      } else {
        this.cursor.insert(value);
      }
    },
    dump: function dump() {
     return new Cursor(this.root).dump();
    }
  };
}

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
  console.log('lex_end: ' + context.dump());
  var c = new Cursor(context.root);
  c.walk(function(entry) {
    console.log('walking, entry=' + util.inspect(entry));
    var value = resolve(entry, context);
    if (null != value) context.writer(value);
  });
}

function parser(token, context) {
  console.log('parser(' + token.type + ',' + token.value + ') tree=' + context.dump());
  switch(token.type) {
  case 'open':
    context.push();
    break;
  case 'symbol':
    context.record(token.value);
    break;
  case 'close':
    context.pop();
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
