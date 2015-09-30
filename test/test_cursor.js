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

  var c2 = new Cursor(head);
  t.equal(c2.get(), 'lala', 'new cursor head should get correct value');
  c2.forward();
  t.equal(c2.get(), 'po', 'new cursor forward should get correct value');
  c2.back();
  t.equal(c2.get(), 'lala', 'new cursor back should get correct value');

  t.end();
});

test('unlink at end', function (t) {
  var cc = new Cursor();
  var a = cc.insert('a');
  var b = cc.insert('b');
  var c = cc.insert('c');

  t.equal(cc.link, c, 'cursor is at end of list');
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(b.prev, a, 'b has correct prev');
  t.equal(c.prev, b, 'c has correct prev');

  t.equal(a.next, b, 'a has correct next');
  t.equal(b.next, c, 'b has correct next');
  t.equal(c.next, null, 'c has correct next');

  cc.unlink();

  t.equal(cc.link, b, 'cursor is no longer at end of list');
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(b.prev, a, 'b has correct prev');
  t.equal(c.prev, b, 'c has old prev');

  t.equal(a.next, b, 'a has correct next');
  t.equal(b.next, null, 'b has correct next');
  t.equal(c.next, null, 'c has old next');
  
  var d = cc.insert('d');
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(b.prev, a, 'b has correct prev');
  t.equal(d.prev, b, 'd has correct prev');

  t.equal(a.next, b, 'a has correct next');
  t.equal(b.next, d, 'b has correct next');
  t.equal(d.next, null, 'd has correct next');


  t.end();
});

test('unlink in middle', function (t) {
  var cc = new Cursor();
  var a = cc.insert('a');
  var b = cc.insert('b');
  var c = cc.insert('c');

  t.equal(cc.link, c, 'cursor is at end of list');
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(b.prev, a, 'b has correct prev');
  t.equal(c.prev, b, 'c has correct prev');

  t.equal(a.next, b, 'a has correct next');
  t.equal(b.next, c, 'b has correct next');
  t.equal(c.next, null, 'c has correct next');

  cc.back();
  t.equal(cc.link, b, 'cursor is no longer at end of list');

  cc.unlink();
  t.equal(cc.link, a, 'cursor is at previous entry');
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(b.prev, a, 'b has old prev');
  t.equal(c.prev, a, 'c has correct prev');

  t.equal(a.next, c, 'a has correct next');
  t.equal(b.next, c, 'b has old next');
  t.equal(c.next, null, 'c has correct next');
  
  var d = cc.insert('d');
  console.log('after insert: ' + new Cursor(a).dump());
  
  t.equal(a.prev, null, 'a has correct prev');
  t.equal(d.prev, a, 'd has correct prev');
  t.equal(c.prev, d, 'c has correct prev');

  t.equal(a.next, d, 'a has correct next');
  t.equal(d.next, c, 'd has correct next');
  t.equal(c.next, null, 'c has correct next');


  t.end();
});
