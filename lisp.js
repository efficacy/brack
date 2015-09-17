
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
var context = [];

function parser(token) {
  console.log('got token type: ' + token.type + ' value: ' + token.value);
}

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
    console.log('status=' + lex_status + ' c=' + c + ' category=' + cc + ' buf=[' + lex_buf + ']');
    switch(cc) {
    case 'ws':
      if (lex_status != 'outside') lex_buf += c;
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
