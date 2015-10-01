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
  this.up = null;
  this.link = link || null;
}
exports.Cursor = Cursor;
exports.Cursor.HEAD = '$head';
exports.Cursor.root = function root() { return new Link(null,null,null,exports.Cursor.HEAD); }

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
    this.link = new Link(this.up, null, null, value);
  } else {
    console.log('insert, this.link.value=' + this.link.value);
    if (null == this.link.value) {
      this.link.value = value;
    } else {
      var link = new Link(this.up, this.link, this.link.next, value);
      if (this.link.next) this.link.next.prev = link;
      this.link.next = link;
      this.link = link;
    }
  }
  return this.link;
};

Cursor.prototype.unlink = function unlink() {
  if (!this.link) return;
  var prev = this.link.prev;
  if (this.link.prev) {
    this.link.prev.next = this.link.next;
  }
  if (this.link.next) {
    this.link.next.prev = this.link.prev;
  }
  var ret = this.link;
  this.link = prev;
//  console.log('after unlink, this.link.value=' + this.link && this.link.value);
  return ret;
};

Cursor.prototype.push = function push() {
  console.log('push');
  var link = new Link(this.link, null, null, null);
  this.up = this.link;
  if (null != this.link && null == this.link.value) {
    this.link.value = link;
  } else {
    this.insert(link);
  }
  this.link = link;
  return this.link;
};

Cursor.prototype.pop = function pop() {
  console.log('pop');
  this.link = (this.up && this.up.next) || this.up;
  this.up = this.link ? this.link.up : null;
  return this.link;
};

Cursor.prototype.get = function get() {
  return this.link ? this.link.value : null;
}

Cursor.prototype.walk = function(entry, done) {
  while (this.link) {
    entry(this.link);
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
        record(begin + new Cursor(link.value).dump(begin, end) + end);
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