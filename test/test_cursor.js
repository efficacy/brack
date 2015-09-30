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
  t.equal(c.get(), 'lala', 'cursor access should get correct value');
  t.end();
});

test('insert on single', function (t) {
  var c = new Cursor();
  var head = c.insert('lala');
  var fresh = c.insert('po');
  t.equal(c.up, null, 'insert should not affect parent');
  t.equal(c.link, fresh, 'insert should set cursor link');
  t.equal(fresh.up, null, 'inserted link should get cursor parent');
  t.equal(fresh.prev, head, 'inserted link should have correct prev');
  t.equal(fresh.next, null, 'inserted link should have no next');
  t.equal(fresh.value, 'po', 'inserted link should get correct value');
  t.equal(c.get(), 'po', 'cursor access should get correct value');
  t.equal(head.up, null, 'original link should have cursor parent');
  t.equal(head.prev, null, 'original link should have no prev');
  t.equal(head.next, fresh, 'original link should have new next');
  t.equal(head.value, 'lala', 'original link should get correct value');
  t.end();
});
