/*jslint node: true */
"use strict";

var brack = require ('../brack');

module.exports = function(test, done) {

  var buf = '';
  function catcher(s) {
    buf += s;
  }

  test('simple values, no brackets', function (t) {
    t.plan(5);

    buf = '';
    brack('hello', catcher);
    t.equal(buf, 'hello', 'string should be just sent to output');

    buf = '';
    brack('12', catcher);
    t.equal(buf, '12', 'number should be just sent to output');

    buf = '';
    brack('-04', catcher);
    t.equal(buf, '-4', 'negative number should be just sent to output');

    buf = '';
    brack('"tinky winky"', catcher);
    t.equal(buf, 'tinky winky', 'quoted string should be just sent to output');

    buf = '';
    brack('"04"', catcher);
    t.equal(buf, '04', 'quoted number should be just sent to output');
  });
};