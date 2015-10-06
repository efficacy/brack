/*jslint node: true */
"use strict";

var util = require('util');

var Cursor = require('./cursor');

function Parser(symbols, write) {
  this.symbols = symbols
  this.write = write || process.stdout.write;
  this.reset();
}

Parser.prototype.reset = function reset() {
  this.root = Cursor.root();
  this.cursor = new Cursor(this.root);
  this.buf = '';
  this.status = 'outside';
}

Parser.prototype.dump = function() {
  return Parser.describe(this.root.next);
};

function category(c) {
  if (c === '(') return 'open';
  if (c === ')') return 'close';
  if (c === "'") return 'sq';
  if (c === '"') return 'dq';
  if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') return 'ws';
  return 'letter';
}

function evaluate(s, context) {
  if (null == s) return null;
  if ((s[0] >= '0' && s[0] <= '9') || s[0] === '-') return Number(s);
  if (s[0] === '"' || s[0] === "'") s = s.substring(1, s.length-1);
  return s;
}

Parser.prototype.chunk = function chunk(s) {
  var self = this;
  function token(type) {
    var value = '' + self.buf;
    self.buf = '';
    self.status = 'outside';
    switch(type) {
    case 'open':
      self.cursor.push();
      break;
    case 'symbol':
      self.cursor.insert(evaluate(value));
      break;
    case 'close':
      self.cursor.pop();
      break;
    }
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
//  console.log('parser ended parsed=' + util.inspect(helper.spool(this.root)));
  return this.root.next;
}

function describe(value) {
  if (null == value) return null;
  return '(' + typeof value + ')' + (value.is_link ? (new Cursor(value).dump()) : util.inspect(value));
}
Parser.describe = describe;

Parser.prototype.lookup = function lookup(name) {
  var ret = null;
  for(var dict = this.symbols[this.symbols.length-1]; dict && !ret; dict = dict.parent) {
    var ret = dict[name];
  }
  return ret || name;
}

Parser.prototype._resolve = function _resolve(value) {
  var self = this;
  var ret = null;

  if (null == value) {
    ret = null;
  } else if ('string' == typeof value) {
    ret = self.lookup(value);
  } else if (value.is_link) {
    if (value.value === Cursor.HEAD) {
      var list = value.next;
      var head = self.resolve(list.value);
      if (null != head) {
        if ('function' === typeof(head)) {
          var tail = list.next;
          ret = head(tail, self);
        } else {
          var c = new Cursor(value);
          c.walk(function(link) {
            var ret = self.resolve(link.value); 
            if (ret && ret !== link.value) {
              c.replace(ret);
            }
          });
          return value;
        }
      }
    } else {
      ret = self.resolve(value.value);
    }
  } else {
    ret = value;
  }

  return ret;
}

Parser.prototype.resolve = function resolve(value) {
  var prev = null;
  var resolved = value;
  while (resolved != null && (resolved.is_link || 'string' === typeof resolved) && resolved !== prev) {
    prev = resolved;
    resolved = this._resolve(prev);
  }
  return resolved;
}

module.exports = Parser;
