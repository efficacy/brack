var util = require('util');

function category(c) {
  if (c == '(') return 'open';
  if (c == ')') return 'close';
  if (c == '\'') return 'sq';
  if (c == '"') return 'dq';
  if (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f') return 'ws';
  return 'letter';
}

var lex_buf = '';
var lex_status = 'outside';

function lex(s, parser) {
  function emit(type) {
    lex_status = 'outside';
    var value = '' + lex_buf;
    lex_buf = '';
    parser({type: type, value: value});
  }
  var n = s.length;
  for (var i = 0; i < n; ++i) {
    c = s[i];
    var cc = category(c);
//    console.log('status=' + lex_status + ' c=' + c + ' category=' + cc + ' buf=[' + lex_buf + ']');
    switch(cc) {
    case 'ws':
      if (lex_status == 'sq' || lex_status == 'dq') lex_buf += c;
      if (lex_status == 'symbol') emit('symbol');
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
      	emit('symbol');
      } 
      break;
    case 'open':
    case 'close':
      if (lex_status == 'symbol') emit('symbol');
      if (lex_status == 'sq' || lex_status == 'dq') {
      	lex_buf += c;
      } else {
        emit(cc);
      }
      break;
    }
  }
}

var symbols = {
  echo: function(tree) { console.log('echo tree=' + util.inspect(tree)); return ""; }
};

function evaluate(s) {
  if (s[0] === '"' || s[0] === "'") return s.substring(1, s.length-1);
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  return symbols[s] || s;
}

function execute(tree) {
  if (tree.length > 0 && 'function' === typeof(tree[0])) return tree[0](tree);
  return tree;
}

var parse_stack = [];
var parse_tree = null;

function parser(token) {
//  console.log('got token type: ' + token.type + ' value: ' + token.value);
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
    var value = execute(parse_tree);
    parse_tree = parse_stack.pop();
    if (null == parse_tree) {
      console.log(value);
    } else {
      parse_tree.push(value);
    }
    break;
  }
//  console.log('parsed ' + token.type + ' tree: ' + util.inspect(parse_tree));
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    lex(chunk, parser);
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
