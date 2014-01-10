var path = require('path'),
    grunt = require('grunt'),
    scsslint = require('../tasks/lib/scss-lint').init(grunt),
    fixtures = path.join(__dirname, 'fixtures'),
    reporterOutFile = path.join(__dirname, 'output.xml'),
    options = {config: path.join(fixtures, '.scss-lint-test.yml')};

exports.scsslint = {
  fail: function(test) {
    test.expect(3);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, options, function(results) {
      test.ok(results[0].indexOf('Class `Button` in selector should be written in all lowercase as `button`') !== -1, 'Should report bad case.');
      test.ok(results[1].indexOf('Properties should be sorted in alphabetical order, with vendor-prefixed extensions before the standardized CSS property') !== -1, 'Should report bad ordering.');
      test.ok(results[2].indexOf('Color `black` should be written in hexadecimal form as `#000`') !== -1, 'Should report string colour usage.');
      test.done();
    });
  },

  pass: function(test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint(files, options, function(results) {
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  passWithExcludedFile: function(test) {
    test.expect(1);
    var files = path.join(fixtures, '*.scss'),
        options = {exclude: path.join(fixtures, 'fail.scss')};

    scsslint.lint(files, options, function(results) {
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  failWithBadOptions: function(test) {
    test.expect(1);
    var files = '--incorrectlySpecifyingAnOptionAsAFile';

    scsslint.lint(files, options, function(results) {
      test.ok(!results, 'There should be no lint errors but should return failure');
      test.done();
    });
  },

  multipleFiles: function(test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint([files, files, files], options, function(results) {
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  reporter: function(test) {
    test.expect(1);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, {reporterOutput: reporterOutFile}, function(results) {
      var report = grunt.file.read(reporterOutFile);

      test.ok(report.indexOf(results[0]) !== -1, 'Should write the errors out to a report');
      test.done();
    });
  }
};
