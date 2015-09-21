/*jslint node: true */
"use strict";
var async = require('async');

module.exports = function(test, next) {
  async.series([
    function(done) { require('./test_parser')(test, done); }
  ], function(err) {
    next();
  });
};
