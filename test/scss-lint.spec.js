var _ = require('lodash'),
    chalk = require('chalk'),
    expect = require('expect.js'),
    fs = require('fs'),
    
    escapeRe = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    grunt = require('grunt'),
    hooker = grunt.util.hooker,
    scsslint = require('../tasks/lib/scss-lint').init(grunt),

    path = require('path'),
    fixtures = path.join(__dirname, 'fixtures'),
    defaultOptions = {
      config: path.join(fixtures, '.scss-lint-test.yml')
    },
    reporterOutFile = path.join(__dirname, 'output.xml');

describe('grunt-scss-lint', function () {
  beforeEach(function (done) {
    fs.stat(reporterOutFile, function (err, stats) {
      if (!err) {
        fs.unlink(reporterOutFile, done);
      } else {
        done();
      }
    });
  });

  it('fail', function () {
    var files = path.join(fixtures, 'fail.scss');
    scsslint.lint(files, defaultOptions, function (results) {
      results = results.split('\n');
      expect(results[0]).to.contain('SelectorFormat: Selector `Button` should be written in lowercase with hyphens');
      expect(results[1]).to.contain('PropertySortOrder: Properties should be ordered color, display');
      expect(results[2]).to.contain('Color `black` should be written in hexadecimal form as `#000000`');
      expect(results[3]).to.contain('Files should end with a trailing newline');
      expect(results.length).to.be(4);
    });
  });

  it('pass', function () {
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint(files, defaultOptions, function (results) {
      expect(results).to.not.be.ok();
    });
  });

  it('pass with force', function (done) {
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

      expect(stdout[1]).to.contain('scss-lint failed, but was run in force mode');
      done();
    });
  });

  it('debug option', function (done) {
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

      expect(stdoutMsg).to.contain('Run command: scss-lint -c');
      done();
    });
  });

  it('bundle exec', function (done) {
    var files = path.join(fixtures, 'pass.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      bundleExec: true
    });

    scsslint.lint(files, testOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('pass with excluded file', function (done) {
    var files = path.join(fixtures, '*.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      exclude: [
        path.join(fixtures, 'fail.scss'),
        path.join(fixtures, 'fail2.scss')
      ]
    });

    scsslint.lint(files, testOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('fail with bad options', function (done) {
    var files = '--incorrectlySpecifyingAnOptionAsAFile';

    scsslint.lint(files, defaultOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('multiple files', function (done) {
    var files = path.join(fixtures, 'pass.scss');
    scsslint.lint([files, files, files], defaultOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('reporter', function (done) {
    var files = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(files, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);
      results = results.split('\n');

      expect(report).to.contain(results[0]);
      expect(report).to.contain('errors="4"');
      done();
    });
  });

  it('reporter errors', function (done) {
    var files = path.join(fixtures, 'pass.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(files, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);

      expect(report).to.contain('errors="0"');
      done();
    });
  });

  it('colorize output', function (done) {
    var file = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      colorizeOutput: true,
      colouriseOutput: true
    });

    scsslint.lint(file, testOptions, function (results) {
      var styles = chalk.styles;
      results = results.split('\n')[0];

      expect(results).to.contain(styles.cyan.open + file);
      expect(results).to.contain(styles.magenta.open + '1');
      expect(results).to.contain(styles.yellow.open + '[W]');
      done();
    });
  });

  it('compact without color', function (done) {
    var file1 = path.join(fixtures, 'fail.scss'),
        file2 = path.join(fixtures, 'fail2.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      compact: true
    });

    scsslint.lint([file1, file2], testOptions, function (results) {
      results = results.split('\n');

      expect(results[1]).to.contain(file1);
      expect(results[2]).to.contain('1:');
      expect(typeof(/\:\s(.+)/.exec(results[2])[1])).to.be('string');
      expect(results[7]).to.contain(file2);
      done();
    });
  });

  it('compact with color', function (done) {
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

      expect(results[1]).to.contain(styles.cyan.open + file1);
      expect(results[2]).to.contain(styles.magenta.open + '1' + styles.magenta.close + ':');
      expect(typeof(new RegExp(escapeRe(styles.magenta.close) + '\\:\\s(.+)').exec(results[2])[1])).to.be('string');
      expect(results[7]).to.contain(styles.cyan.open + file2);
      done();
    });
  });

  it('pluralize single file', function (done) {
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

      expect(stdoutMsg).to.contain('1 file is lint free');
      done();
    });
  });

  it('pluralize multiple files', function (done) {
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

      expect(stdoutMsg).to.contain(files.length + ' files are lint free');
      done();
    });
  });

  it('emit error', function (done) {
    var file1 = path.join(fixtures, 'fail.scss'),
        eventEmitted = false,
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      emitError: true
    });

    grunt.event.on('scss-lint-error', function () {
      eventEmitted = true;
    });

    scsslint.lint(file1, testOptions, function (results) {
      results = results.split('\n');

      expect(results.length).to.be(4);
      expect(eventEmitted).to.be.ok();
      done();
    });
  });

  it('emit success', function (done) {
    var file1 = path.join(fixtures, 'pass.scss'),
        eventEmitted = false,
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      emitSuccess: true
    });

    grunt.event.on('scss-lint-success', function () {
      eventEmitted = true;
    });

    scsslint.lint(file1, testOptions, function (results) {
      expect(eventEmitted).to.be.ok();
      done();
    });
  });

  it('exit code on failure', function (done) {
    grunt.util.spawn({grunt: true, args: ['scsslint']}, function (error, result, code) {
      expect(code).not.to.be(0);
      done();
    });
  });

  it('exit code and output on missing ruby', function (done) {
    grunt.util.spawn({grunt: true, args: ['scsslint'], opts: {env: {PATH: '.'}}}, function (error, result, code) {
      expect(code).not.to.be(0);
      expect(result.stdout).to.contain('Please make sure you have ruby installed');
      done();
    });
  });

  it('exit code on success', function (done) {
    grunt.util.spawn({grunt: true, args: ['scsslint:success']}, function (error, result, code) {
      expect(code).to.be(0);
      done();
    });
  });

  it('max buffer', function (done) {
    var files = path.join(fixtures, 'fail.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      maxBuffer: false
    });

    scsslint.lint(files, testOptions, function (results) {
      expect(results).not.to.be.ok();
      done();
    });
  });
});
