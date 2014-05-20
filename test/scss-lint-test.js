  var path = require('path'),
    grunt = require('grunt'),
    hooker = grunt.util.hooker,
    chalk = require('chalk'),
    scsslint = require('../tasks/lib/scss-lint').init(grunt),
    fixtures = path.join(__dirname, 'fixtures'),
    reporterOutFile = path.join(__dirname, 'output.xml'),
    options = {config: path.join(fixtures, '.scss-lint-test.yml')};

exports.scsslint = {
  setUp: function (done) {
    grunt.file.delete(reporterOutFile);
    done();
  },

  fail: function (test) {
    test.expect(5);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, options, function (results) {
      results = results.split("\n");
      test.ok(
        results[0].indexOf('Class `Button` in selector should be written in all lowercase as `button`') !== -1,
        'Should report bad case.'
      );
      test.ok(
        results[1].indexOf('Properties should be sorted in order, with vendor-prefixed extensions before the ' +
          'standardized CSS property') !== -1,
        'Should report bad ordering.'
      );
      test.ok(
        results[2].indexOf('Color `black` should be written in hexadecimal form as `#000000`') !== -1,
        'Should report string colour usage.'
      );
      test.ok(
        results[3].indexOf('Files should end with a trailing newline') !== -1,
        'Should report trailing newline.'
      );
      test.ok(results.length === 4);
      test.done();
    });
  },

  pass: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint(files, options, function (results) {
      results = results.split("\n");
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  debugOption: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss'),
        muted = grunt.log.muted,
        stdoutMsg = '';

    grunt.log.muted = false;

    hooker.hook(process.stdout, 'write', {
      pre: function (result) {
        stdoutMsg += grunt.log.uncolor(result);
        return hooker.preempt();
      }
    });

    grunt.option('debug', true);
    scsslint.lint(files, options, function () {
      grunt.option('debug', undefined);
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(stdoutMsg.indexOf('Run command: scss-lint -c') !== -1, 'Show debug information');
      test.done();
    });
  },

  bundleExec: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    options['bundleExec'] = true;
    scsslint.lint(files, options, function (results) {
      results = results.split("\n");
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  passWithExcludedFile: function (test) {
    test.expect(1);
    var files = path.join(fixtures, '*.scss'),
        options = {exclude: path.join(fixtures, 'fail.scss')};

    scsslint.lint(files, options, function (results) {
      results = results.split("\n");
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  failWithBadOptions: function (test) {
    test.expect(1);
    var files = '--incorrectlySpecifyingAnOptionAsAFile';

    scsslint.lint(files, options, function (results) {
      test.ok(!results, 'There should be no lint errors but should return failure');
      test.done();
    });
  },

  multipleFiles: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint([files, files, files], options, function (results) {
      results = results.split("\n");
      test.ok(results[0] === '', 'There should be no lint errors');
      test.done();
    });
  },

  reporter: function (test) {
    test.expect(2);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, {reporterOutput: reporterOutFile}, function (results) {
      var report = grunt.file.read(reporterOutFile);

      results = results.split("\n");

      test.ok(report.indexOf(results[0]) !== -1, 'Should write the errors out to a report');
      test.ok(report.indexOf('errors="4"') !== -1, 'Should write the number of errors out to a report');
      test.done();
    });
  },

  reporterErrors: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint(files, {reporterOutput: reporterOutFile}, function (results) {

      var report = grunt.file.read(reporterOutFile);

      test.ok(report.indexOf('errors="0"') !== -1, 'Should write the number of errors out to a report');
      test.done();
    });
  },

  colorizeOutput: function (test) {
    test.expect(3);
    var file = path.join(fixtures, 'fail.scss');
    scsslint.lint(file, {colorizeOutput: true, colouriseOutput: true}, function (results) {
      var styles = chalk.styles;

      results = results.split("\n")[0];

      test.ok(
        results.indexOf(styles.cyan.open + file) !== -1,
        'Should report colorized file name.'
      );
      test.ok(
        results.indexOf(styles.magenta.open + '1' !== -1,
        'Should report colorized file line.')
      );
      test.ok(
        results.indexOf(styles.yellow.open + '[W]' !== -1,
        'Should report colorized warning.')
      );
      test.done();
    });
  },

  pluralizeSingleFile: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss'),
      muted = grunt.log.muted,
      stdoutMsg = '';

    grunt.log.muted = false;

    hooker.hook(process.stdout, 'write', {
      pre: function (result) {
        stdoutMsg += grunt.log.uncolor(result);
        return hooker.preempt();
      }
    });

    scsslint.lint(files, options, function () {
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(stdoutMsg.indexOf('1 file is lint free') !== -1, 'Report single file lint free');
      test.done();
    });
  },

  pluralizeMultipleFiles: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss'),
      muted = grunt.log.muted,
      stdoutMsg = '';

    grunt.log.muted = false;

    hooker.hook(process.stdout, 'write', {
      pre: function (result) {
        stdoutMsg += grunt.log.uncolor(result);
        return hooker.preempt();
      }
    });

    files = [files, files];
    scsslint.lint(files, options, function () {
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(stdoutMsg.indexOf(files.length + ' files are lint free') !== -1, 'Report multiple files lint free');
      test.done();
    });
  }
};
