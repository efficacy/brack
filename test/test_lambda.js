/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('lambda', function (t) {

  t.equal(brack(
      '((lambda (a) (echo a))'+
      '"hello")'
    ), 'hello', 'lambda should be usable immediately');

  t.equal(brack(
      '(def e (lambda (a) (echo a)))' +
      '(e "hello")'
    ), 'hello', 'lambda should be definable');

  t.end();
});
