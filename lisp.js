process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write('data: ' + chunk);
    lex(chunk, null);
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});

var lex_buf = '';
var lex_status = 'outside';

function category(c) {
  if (c == '(') return 'open';
  if (c == ')') return 'close';
  if (c == '\'') return 'sq';
  if (c == '"') return 'dq';
  if (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f') return 'ws';
  return 'letter';
}

function lex(s, parser) {
  var n = s.length;
  for (var i = 0; i < n; ++i) {
    c = s[i];
    var cc = category(c);
    console.log('c=' + c + ' category=' + cc);
  }
}

