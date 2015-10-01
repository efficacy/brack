/*jslint node: true */
"use strict";

var util = require('util');

var Cursor = require('./list').Cursor;

function category(c) {
  if (c === '(') return 'open';
  if (c === ')') return 'close';
  if (c === "'") return 'sq';
  if (c === '"') return 'dq';
  if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') return 'ws';
  return 'letter';
}

function Parser() {
  this.root = Cursor.root();
  this.cursor = new Cursor(this.root);
  this.buf = '';
  this.status = 'outside';
}

Parser.prototype.push = function() {
  this.cursor.push();
};

Parser.prototype.push = function() {
  this.cursor.pop();
};

Parser.prototype.unlink = function() {
  this.cursor.unlink();
};

Parser.prototype.insert = function(value) {
  if (null == value) return;
  this.cursor.insert(value);
};

Parser.prototype.dump = function() {
  new Cursor(this.root.next).dump();
};

Parser.prototype.chunk = function chunk(s) {
  var self = this;
  function token(type) {
    var value = '' + self.buf;
    self.buf = '';
    self.status = 'outside';
    self.token({type: type, value: value});
  }

  var n = s.length;
  for (var i = 0; i < n; ++i) {
    var c = s[i];
    var cc = category(c);

    switch(cc) {
    case 'ws':
      if (self.status == 'sq' || self.status == 'dq') self.buf += c;
      if (self.status == 'symbol') token('symbol');
      break;
    case 'letter':
      self.buf += c;
      if (self.status == 'outside') self.status = 'symbol';
      break;
    case 'sq':
    case 'dq':
      self.buf += c;
      if (self.status == 'outside') {
        self.status = cc;
      } else if (self.status == cc) {
        token('symbol');
      }
      break;
    case 'open':
    case 'close':
      if (self.status == 'symbol') token('symbol');
      if (self.status == 'sq' || self.status == 'dq') {
        self.buf += c;
      } else {
        token(cc);
      }
      break;
    }
  }
}

Parser.prototype.end = function end() {
  this.chunk('\n'); // TODO can this be done more cleanly?
  return this.root.next;
}

function evaluate(s, context) {
  if (null == s) return null;
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return s;
}

Parser.prototype.token = function token(token) {
  var self = this;
  console.log('token(' + token.type + ',' + token.value + ')');
  switch(token.type) {
  case 'open':
    self.cursor.push();
    break;
  case 'symbol':
    self.insert(evaluate(token.value));
    console.log('inserted symbol, tree=' + new Cursor(self.root).dump());
    break;
  case 'close':
    self.pop();
    break;
  }
}

module.exports = function(script) {
  var parser = new Parser();
  parser.chunk(script);
  var parsed = parser.end();
  return new Cursor(parsed).dump();
}

if (module === require.main) {
  var immediate = process.stdout.isTTY;

  var parser = new Parser();

  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (null != chunk) {
      parser.chunk(script);
    }
  });

  process.stdin.on('end', function() {
    var parsed = parser.end();
    process.stdout.write(new Cursor(parsed).dump());
  });
}
