/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../brack');

test('call primitive through define', function (t) {
  t.equal(brack('(def plus (primitive "./library/plus"))(plus hello there)'), 'hellothere', 'defined primitive call should resolve');
  t.end();
});

test('call primitive direct', function (t) {
  t.equal(brack('((primitive "./library/plus") hello there))'), 'hellothere', 'direct primitive call should resolve');
  t.end();
});
