/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');

function Link(up, prev, next, value) {
  this.up = up;
  this.prev = prev;
  this.next = next;
  this.value = value;
}

Link.prototype.is_link = true;

function Cursor(link) {
  this.link = link;
}
exports.Cursor = Cursor;
exports.Cursor.HEAD = '$head';
exports.Cursor.root = function root() { return new Link(null,null,null,Cursor.HEAD); }

Cursor.prototype.forward = function forward() {
  this.link = this.link ? this.link.next : this.link;
  return this.link;
};

Cursor.prototype.back = function back() {
  this.link = this.link ? this.link.prev : this.link;
  return this.link;
};

Cursor.prototype.insert = function insert(value) {
  if (!this.link) {
    this.link = new Link(null, null, null, value);
  } else {
    if (null == this.link.value) {
      this.link.value = value;
    } else {
      var link = new Link(this.link.up, this.link, this.link.next, value);
      if (this.link.next) this.link.next.prev = link;
      this.link.next = link;
      this.forward();
    }
  }
  return this.link;
};

Cursor.prototype.unlink = function unlink() {
  if (!this.link) return;
  var prev = this.link.prev;
  if (this.link.prev) {
    this.link.prev.next = this.link.next;
  } else if (this.link.up) {
    this.link.up.value = this.link.next;
  }
  if (this.link.next) {
    this.link.next.prev = this.link.prev;
  }
  var ret = this.link;
  this.link = prev;
  return ret;
};

Cursor.prototype.push = function push() {
  var link = new Link(this.link, null, null, Cursor.HEAD);
  this.insert(link);
  this.link = link;
  return this.link;
};

Cursor.prototype.pop = function pop() {
  this.link = this.link.up;
  this.up = this.link ? this.link.up : null;
  this.forward();
  return this.link;
};

Cursor.prototype.get = function get() {
  return this.link ? this.link.value : null;
}

Cursor.prototype.walk = function(entry, done) {
  while (this.link) {
    if (this.link.value !== Cursor.HEAD) entry(this.link);
    this.forward();
  }
  if (done) done();
}

Cursor.prototype.dump = function dump(begin, end, sep) {
  begin = null==begin ? '[' : begin;
  end = null==end ? ']' : end;
  sep = null== sep ? ' ' : sep;
  var ret = '';
  var had = false;
  function record(s) {
    if (had) ret += sep;
    ret += s;
    had = true;
  }
  this.walk(function(link) {
    if (link.value) {
      if (link.value.is_link) {
        record(begin + new Cursor(link.value.next).dump(begin, end) + end);
      } else {
        if (null != link.value) {
          record(link.value);
        }
      }
    } else {
      record('*empty*');
    }
  });
  return ret;
}
