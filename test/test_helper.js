/*jslint node: true */
"use strict";

var test = require('tape');
var util = require('util');

var Cursor = require ('../cursor');

var helper = require('./helper');

test('spool empty', function (t) {
  var cc = new Cursor();
  var spooled = helper.spool(cc.head);
  t.equal(spooled.length, 0, 'empty spools to empty');
  t.end();
});

test('spool single', function (t) {
  var cc = new Cursor();
  cc.insert('hello');
  var spooled = helper.spool(cc.head);
  t.equal(spooled.length, 1, 'single spools to single');
  t.equal(spooled[0], 'hello', 'single spools correct value');
  t.end();
});

test('spool multiple', function (t) {
  var cc = new Cursor();
  cc.insert('hello');
  cc.insert('there');
  cc.insert('where');
  var spooled = helper.spool(cc.head);
  t.equal(spooled.length, 3, 'single spools to single');
  t.equal(spooled[0], 'hello', 'multiple spools correct value 1');
  t.equal(spooled[1], 'there', 'multiple spools correct value 2');
  t.equal(spooled[2], 'where', 'multiple spools correct value 3');
  t.end();
});

test('spool nested', function (t) {
  var cc = new Cursor();
  cc.insert('goodbye');
  var dd = new Cursor();
  dd.insert('cruel');
  cc.insert(dd.head);
  cc.insert('world');
  var spooled = helper.spool(cc.head);
  t.equal(spooled.length, 3, 'single spools to single');
  t.equal(spooled[0], 'goodbye', 'nested spools correct value 1');
  t.equal(spooled[1].length, 1, 'nested spool has correct length');
  t.equal(spooled[1][0], 'cruel', 'nested spool has correct value');
  t.equal(spooled[2], 'world', 'nested spools correct value 3');
  t.end();
});
