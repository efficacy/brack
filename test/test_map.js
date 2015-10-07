/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('map with no function', function (t) {
  t.equal(brack('(def map (primitive "./library/map"))' +
      '(map)'
    ), '', 'map with no function should give nothing');
  t.end();
});

test('map with no args', function (t) {
  t.equal(brack(
      '(def map (primitive "./library/map"))' +
      '(map echo)'
    ), '', 'map with no args should give nothing');
  t.end();
});

test('map with one arg', function (t) {
  t.equal(brack(
      '(def map (primitive "./library/map"))' +
      '(map echo (hello))'
    ), 'hello', 'map with one arg should give f(arg)');
  t.end();
});

test('map with multiple args', function (t) {
  t.equal(brack(
      '(def map (primitive "./library/map"))' +
      '(map echo (hello there world))'
     ), 'hellothereworld', 'map with multiple args should call all');
  t.end();
});

test('map with multiple args', function (t) {
  t.equal(brack(
      '(def map (primitive "./library/map"))' +
      '(def + (primitive "./library/plus"))' +
      '(def extra (lambda (a) (+ 2 a)))' +
      '(echo (map extra (1 2 3)))'
    ), '3 4 5', 'map with multiple args should call all');
  t.end();
});
