var util = require('util');

function tail(list, n) { return list.slice(n||1); }

var symbols = {
  def: function(list) { symbols[list[1]] = list[2]; },

  echo: function(list) { process.stdout.write(util.inspect(tail(list)) + '\n'); }
};

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
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return symbols[s] || s;
}

function execute(tree) {
  if (tree.length > 0 && 'function' === typeof(tree[0])) return tree[0](tree);
  return tree;
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
    var value = evaluate(token.value);
    parse_tree.push(value);
    break;
  case 'close':
    var value = execute(parse_tree) || '';
    parse_tree = parse_stack.pop();
    if (null == parse_tree) {
      process.stdout.write(value.toString() + '\n');
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
