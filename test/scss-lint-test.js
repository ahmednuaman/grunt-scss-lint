'use strict';

var path = require('path'),
    grunt = require('grunt'),
    scsslint = require('../tasks/lib/scss-lint').init(grunt),
    fixtures = path.join(__dirname, 'fixtures'),
    hooker = grunt.util.hooker,
    options = { config: '../.scss-lint.yml' },
    stdoutEqual;

stdoutEqual = function(callback, done) {
  var actual = '';

  hooker.hook(process.stdout, 'write', {
    pre: function(result) {
      actual += grunt.log.uncolor(result);
      return hooker.preempt();
    }
  });

  callback();
  hooker.unhook(process.stdout, 'write');
  done(actual);
};

exports.scsslint = {
  fail: function(test) {
    test.expect(1);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, options, function(results) {
      test.ok(results[0].indexOf('Class `Button` in selector should be written in all lowercase as `button`') !== -1, 'Should report bad case.');
      test.ok(results[1].indexOf('Properties should be sorted in alphabetical order, with vendor-prefixed extensions before the standardized CSS property') !== -1, 'Should report bad ordering.');
      test.ok(results[2].indexOf('Color `black` should be written in hexadecimal form as `#000`') !== -1, 'Should report string colour usage.');
      test.done();
    });
  }//,

  // pass: function(test) {
  //   test.expect(1);
  //   var files = path.join(fixtures, 'pass.scss');
  //   scsslint.lint(files, options, function(results) {
  //     test.equal(results[0], 'Missing semicolon.', 'Should reporter a missing semicolon.');
  //     test.done();
  //   });
  // }
};
