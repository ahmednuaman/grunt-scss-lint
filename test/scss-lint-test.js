var path = require('path'),
    grunt = require('grunt'),
    _ = require('lodash'),
    hooker = grunt.util.hooker,
    chalk = require('chalk'),
    scsslint = require('../tasks/lib/scss-lint').init(grunt),
    fixtures = path.join(__dirname, 'fixtures'),
    reporterOutFile = path.join(__dirname, 'output.xml'),
    escapeRe = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },
    defaultOptions;

defaultOptions = {
  config: path.join(fixtures, '.scss-lint-test.yml')
};

exports.scsslint = {
  setUp: function (done) {
    grunt.file.delete(reporterOutFile);
    done();
  },

  fail: function (test) {
    test.expect(5);
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, defaultOptions, function (results) {
      results = results.split('\n');
      test.ok(
        results[0].indexOf('SelectorFormat: Selector `Button` should be written in lowercase with hyphens') !== -1,
        'Should report bad case.'
      );
      test.ok(
        results[1].indexOf('PropertySortOrder: Properties should be ordered color, display') !== -1,
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
    scsslint.lint(files, defaultOptions, function (results) {
      test.ok(!results, 'There should be no lint errors');
      test.done();
    });
  },

  passWithForce: function (test) {
    test.expect(2);
    var files = path.join(fixtures, 'fail.scss'),
        muted = grunt.log.muted,
        stdout = [],
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      force: true
    });

    grunt.log.muted = false;

    hooker.hook(process.stdout, 'write', {
      pre: function (result) {
        stdout.push(grunt.log.uncolor(result));
        return hooker.preempt();
      }
    });

    scsslint.lint(files, testOptions, function (results) {
      grunt.option('debug', undefined);
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(results, 'Should return results.');

      test.ok(
        stdout[1].indexOf('scss-lint failed, but was run in force mode') !== -1,
        'Should log forcing.'
      );

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

    scsslint.lint(files, defaultOptions, function () {
      grunt.option('debug', undefined);
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(stdoutMsg.indexOf('Run command: scss-lint -c') !== -1, 'Show debug information');
      test.done();
    });
  },

  bundleExec: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      bundleExec: true
    });

    scsslint.lint(files, testOptions, function (results) {
      test.ok(!results, 'There should be no lint errors');
      test.done();
    });
  },

  passWithExcludedFile: function (test) {
    test.expect(1);
    var files = path.join(fixtures, '*.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      exclude: [
        path.join(fixtures, 'fail.scss'),
        path.join(fixtures, 'fail2.scss')
      ]
    });

    scsslint.lint(files, testOptions, function (results) {
      test.ok(!results, 'There should be no lint errors');
      test.done();
    });
  },

  failWithBadOptions: function (test) {
    test.expect(1);
    var files = '--incorrectlySpecifyingAnOptionAsAFile';

    scsslint.lint(files, defaultOptions, function (results) {
      test.ok(!results,
        'There should be no lint errors but should return failure');
      test.done();
    });
  },

  multipleFiles: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint([files, files, files], defaultOptions, function (results) {
      test.ok(!results,
        'There should be no lint errors');
      test.done();
    });
  },

  reporter: function (test) {
    test.expect(2);
    var files = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(files, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);

      results = results.split('\n');

      test.ok(report.indexOf(results[0]) !== -1,
        'Should write the errors out to a report');
      test.ok(report.indexOf('errors="4"') !== -1,
        'Should write the number of errors out to a report');
      test.done();
    });
  },

  reporterErrors: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'pass.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(files, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);

      test.ok(report.indexOf('errors="0"') !== -1,
        'Should write the number of errors out to a report');
      test.done();
    });
  },

  colorizeOutput: function (test) {
    test.expect(3);
    var file = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      colorizeOutput: true,
      colouriseOutput: true
    });

    scsslint.lint(file, testOptions, function (results) {
      var styles = chalk.styles;

      results = results.split('\n')[0];

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

  compactWithoutColor: function (test) {
    test.expect(4);
    var file1 = path.join(fixtures, 'fail.scss'),
        file2 = path.join(fixtures, 'fail2.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      compact: true
    });

    scsslint.lint([file1, file2], testOptions, function (results) {
      results = results.split('\n');

      test.ok(
        results[1].indexOf(file1) !== -1,
        'Should report file name of first file.'
      );

      test.ok(
        results[2].indexOf('1:') !== -1,
        'Should report line number for first file.'
      );

      test.ok(
        typeof(/\:\s(.+)/.exec(results[2])[1]) === 'string',
        'Should report description for first file.'
      );

      test.ok(
        results[7].indexOf(file2) !== -1,
        'Should report file name of second file.'
      );

      test.done();
    });
  },

  compactWithColor: function (test) {
    test.expect(4);
    var file1 = path.join(fixtures, 'fail.scss'),
        file2 = path.join(fixtures, 'fail2.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      colorizeOutput: true,
      colourizeOutput: true,
      compact: true
    });

    scsslint.lint([file1, file2], testOptions, function (results) {
      var styles = chalk.styles;
      results = results.split('\n');

      test.ok(
        results[1].indexOf(styles.cyan.open + file1) !== -1,
        'Should report file name of first file.'
      );

      test.ok(
        results[2].indexOf(styles.magenta.open + '1' + styles.magenta.close + ':') !== -1,
        'Should report line number for first file.'
      );

      test.ok(
        typeof(new RegExp(escapeRe(styles.magenta.close) + '\\:\\s(.+)').exec(results[2])[1]) === 'string',
        'Should report description for first file.'
      );

      test.ok(
        results[7].indexOf(styles.cyan.open + file2) !== -1,
        'Should report file name of second file.'
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

    scsslint.lint(files, defaultOptions, function () {
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
    scsslint.lint(files, defaultOptions, function () {
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      test.ok(stdoutMsg.indexOf(files.length + ' files are lint free') !== -1, 'Report multiple files lint free');
      test.done();
    });
  },

  emitError: function (test) {
    test.expect(1);
    var file1 = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      emitError: true
    });

    scsslint.lint(file1, testOptions, function (results) {
      results = results.split('\n');
      test.ok(results.length === 4);
      test.done();
    });
  },

  exitCodeOnFailure: function (test) {
    test.expect(1);
    grunt.util.spawn({grunt: true, args: ['scsslint']}, function (error, result, code) {
      test.notEqual(code, 0);
      test.done();
    });
  },

  exitCodeAndOutputOnMissingRuby: function (test) {
    test.expect(2);
    grunt.util.spawn({grunt: true, args: ['scsslint'], opts: {env: {PATH: '.'}}}, function (error, result, code) {
      test.notEqual(code, 0);
      test.ok(result.stdout.match('Please make sure you have ruby installed'));
      test.done();
    });
  },

  exitCodeOnSuccess: function (test) {
    test.expect(1);
    grunt.util.spawn({grunt: true, args: ['scsslint:success']}, function (error, result, code) {
      test.equal(code, 0);
      test.done();
    });
  },

  maxBuffer: function (test) {
    test.expect(1);
    var files = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      maxBuffer: false
    });

    scsslint.lint(files, testOptions, function (results) {
      test.ok(!results, 'There should be no lint errors');
      test.done();
    });
  }
};
