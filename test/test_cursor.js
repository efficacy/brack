/*jslint node: true */
"use strict";

var test = require('tape');
var list = require ('../list');
var Cursor = list.Cursor;

test('raw cursor', function (t) {
  var c = new Cursor();
  t.equal(c.up, null, 'initial cursor should have no parent');
  t.equal(c.link, null, 'initial cursor should have no link');
  t.end();
});

test('insert on empty', function (t) {
  var c = new Cursor();
  c.insert('lala');
  t.equal(c.up, null, 'insert should not affect parent');
  t.ok(c.link, 'insert should set cursor link');
  t.equal(c.link.up, null, 'inserted link should get cursor parent');
  t.equal(c.link.prev, null, 'first inserted link should have no prev');
  t.equal(c.link.next, null, 'first inserted link should have no next');
  t.equal(c.link.value, 'lala', 'inserted link should get correct value');
  t.end();
});
