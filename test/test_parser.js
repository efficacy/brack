/*jslint node: true */
"use strict";

var test = require('tape');
var brack = require ('../parser');

test('parse simple values, no brackets', function (t) {

  t.equal(brack('hello'), 'hello', "text should just be text");
  t.equal(brack('12'), '12', "numbers should be numbers");
  t.equal(brack('-04'), '-4', "negatives should still be negative");
  t.equal(brack('"tinky winky"'), 'tinky winky', "quoted text should also be text");
  t.equal(brack('"04"'), '04', "quoted numbers are strings");
  
  t.end();
});
