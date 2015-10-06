/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('include plain text', function (t) {
  t.equal(brack('(include "test/input/hello.txt")'), 'hello', "included plain text should pass through");
  t.end();
});

test('include and assign', function (t) {
  t.equal(brack('(def x1 (include "test/input/hello.txt")) "say " x1'), 'say hello', "included plain text should act as a value");
  t.end();
});

test('include function', function (t) {
  t.equal(brack('(include "test/input/define.bra") (aa "whatever")'), "whatever", 'included function should be callable');
  t.end();
});

test('include nested', function (t) {
  t.equal(brack('(include "library/math.bra") (+ 12 34)'), "46", 'included file should be executed in current context');
  t.end();
});
