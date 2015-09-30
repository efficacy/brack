/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('echo', function (t) {

  t.equal(brack('(echo)'), '', 'echo with no args should not echo');
  t.equal(brack('(echo hello)'), 'hello', 'echo with one string should echo it');
  t.equal(brack('(echo hello there)'), 'hello there', 'echo with two strings should list them');
  t.equal(brack('(echo "hello" there)'), 'hello there', 'echo with quoted strings should still join them');
  t.equal(brack('(echo (hello (here and) there))'), 'hello here and there', 'echo with list should recurse');

//  t.equal(brack('(def plus (primitive "./library/plus"))(echo (plus hello there))'), 'hellothere', 'echo with function call should resolve');

  t.end();
});
