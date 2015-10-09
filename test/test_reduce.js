/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('reduce with no function', function (t) {
  t.equal(brack('(def reduce (primitive "./library/reduce"))' +
      '(reduce)'
    ), '', 'reduce with no function should give nothing');
  t.end();
});

test('reduce with no args', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(reduce echo)'
    ), '', 'reduce with no args should give nothing');
  t.end();
});

test('reduce with non-function', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(reduce zaza (1 2 3))'
    ), '', 'reduce with non-function should give nothing)');
  t.end();
});

test('reduce with one arg', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(def + (primitive "./library/plus"))' +
      '(reduce + (1))'
    ), '', 'reduce with one arg should give nothing)');
  t.end();
});

test('reduce with two args', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(def + (primitive "./library/plus"))' +
      '(reduce + (1 2))'
    ), '3', 'reduce with two args should combine)');
  t.end();
});

test('reduce with multiple args', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(def + (primitive "./library/plus"))' +
      '(reduce + (4 5 7 3))'
    ), '19', 'reduce with multiple args should combine)');
  t.end();
});

test('reduce with mixed args', function (t) {
  t.equal(brack(
      '(def reduce (primitive "./library/reduce"))' +
      '(def + (primitive "./library/plus"))' +
      '(reduce + (the " " 39 " steps"))'
    ), 'the 39 steps', 'reduce with mixed args should combine)');
  t.end();
});
