var util = require('util');

var builtin = {
  parent: null,

  def: function(list) { user[list[0]] = execute(list[1]); },
  lambda: function(list) { return lambda(list[0], list[1]); },
  map: function(list) { return map(execute(list[0]), tail(list)); },
  reduce: function(list) { return reduce(execute(list[0]), tail(list)); },
  echo: function(list) { process.stdout.write(expand(list) + '\n'); },
  plus: function(list) { return execute(list[0]) + execute(list[1]); }
};

var user = { parent: builtin };

var symbols = [ builtin, user ];

function lookup(name) {
  for(var dict = symbols[symbols.length-1]; dict; dict = dict.parent) {
    if (dict[name]) return dict[name];
  }
  return null;
}

function expand(list) {
  var ret = '';
  for (var i = 0; i < list.length; ++i) {
    var s = evaluate(list[i]);
    if (Array.isArray(s)) {
      var val = execute(s);
      if (null != val) ret += '( ' + val + ')';
    } else {
      ret += s;
    }
    ret += ' ';
  }
  return ret;
}

function tail(list, n) { return list.slice(n||1); }

function lambda(args, body) {
  return function(list) {
    var frame = { parent: symbols[symbols.length-1] };
    for (var i = 0; i < args.length; ++i) {
      frame[args[i]] = evaluate(list[i]);
    };
    symbols.push(frame);
    var ret = execute(body);
    symbols.pop();
    return ret;
  };
}

function map(fn, list) {
  var ret = [];
  for (var i = 0; i < list.length; ++i) {
    var result = fn(list[i]);
    if (null != result) ret.push(result);
  }
  return ret;
}

function reduce(fn, list) {
  var ret = execute(list[0]);
  for (var i = 1; i < list.length; ++i) {
    ret = fn([ret, list[i]]);
  }
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

var lex_buf = '';
var lex_status = 'outside';

function lex(s, parser) {
  function token(type) {
    var value = '' + lex_buf;
    lex_buf = '';
    lex_status = 'outside';
    parser({type: type, value: value});
  }

  var n = s.length;
  for (var i = 0; i < n; ++i) {
    c = s[i];
    var cc = category(c);

    switch(cc) {
    case 'ws':
      if (lex_status == 'sq' || lex_status == 'dq') lex_buf += c;
      if (lex_status == 'symbol') token('symbol');
      break;
    case 'letter':
      lex_buf += c;
      if (lex_status == 'outside') lex_status = 'symbol';
      break;
    case 'sq':
    case 'dq':
      lex_buf += c;
      if (lex_status == 'outside') {
        lex_status = cc;
      } else if (lex_status == cc) {
        token('symbol');
      } 
      break;
    case 'open':
    case 'close':
      if (lex_status == 'symbol') token('symbol');
      if (lex_status == 'sq' || lex_status == 'dq') {
      	lex_buf += c;
      } else {
        token(cc);
      }
      break;
    }
  }
}

function evaluate(s) {
  if (Array.isArray(s)) {
    var ret = [];
    for (var i = 0; i < s.length; ++i) {
      ret.push(evaluate(s[i]));
    }
    return ret;
  }
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return lookup(s) || s;
}

function execute(s) {
  if (Array.isArray(s)) {
    var key = (Array.isArray(s[0]))
      ? execute(s[0])
      : evaluate(s[0]);
    if ('function' === typeof(key)) return key(tail(s));
    return s;
  }
  return evaluate(s);
}

var parse_stack = [];
var parse_tree = null;

function parser(token) {
  switch(token.type) {
  case 'open':
    parse_stack.push(parse_tree);
    parse_tree = [];
    break;
  case 'symbol':
    parse_tree.push(token.value);
    break;
  case 'close':
    var value = parse_tree;
    parse_tree = parse_stack.pop();
    if (null == parse_tree) {
      var ret = execute(value);
      if (ret) process.stdout.write(ret.toString() + '\n');
    } else {
      parse_tree.push(value);
    }
    break;
  }
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    lex(chunk, parser);
  }
});

process.stdin.on('end', function() {
  lex(' ', parser);
});
