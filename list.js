/*jslint node: true */
"use strict";

var fs = require('fs');
var util = require('util');

function create_link(up, prev, next, value) {
  return { up: up, prev: prev, next: next, value: value };
}

function Cursor(link) {
  this.up = null;
  this.link = link || null;
}
exports.Cursor = Cursor;

Cursor.prototype.forward = function forward() {
  this.link = link ? link.next : link;
};

Cursor.prototype.back = function back() {
  this.link = link ? link.prev : link;
};

Cursor.prototype.insert = function insert(value) {
  if (!this.link) {
    this.link = create_link(this.up, null, null, value);
  } else {
    var link = create_link(this.up, this.link, this.link.next, value);
    this.link.next = link;
    this.link = link;
  }
};

Cursor.prototype.unlink = function unlink() {
  if (!this.link) return;
  if (this.link.prev) {
    this.link.prev.next = this.link.next;
  }
  if (this.link.next) {
    this.link.next.prev = this.link.prev;
  }
};

Cursor.prototype.push = function push() {
  var link = create_link(this.link, null, null, null);
  this.up = this.link;
  this.link = link;
};
