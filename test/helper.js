/*jslint node: true */
"use strict";

var test = require('tape');
var util = require('util');

var Cursor = require ('../cursor');

function spool(link) {
  var ret = [];
  while(link) {
    if (link.value && link.value.is_link) {
      ret.push(spool(link.value));
    } else if (link.value !== Cursor.HEAD) {
      ret.push(link.value);
    }
    link = link.next;
  }
  return ret;
}
exports.spool = spool;

function same(t, link, expected, message) {
  var spooled = spool(link);
  t.equal(spooled.length, expected.length, message + ' (length)');
  for (var i = 0; i < spooled.length; ++i) {
    t.equal(spooled[i], expected[i], message + ' (entry ' + i + ')');
  }
}
exports.same = same;
