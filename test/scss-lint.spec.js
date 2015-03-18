var _ = require('lodash'),
    chalk = require('chalk'),
    expect = require('expect.js'),
    fs = require('fs'),
    sinon = require('sinon'),
    
    escapeRe = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    grunt = require('grunt'),
    hooker = grunt.util.hooker,
    scsslint = require('../tasks/lib/scss-lint').init(grunt),

    path = require('path'),
    fixtures = path.join(__dirname, 'fixtures'),
    defaultOptions = {},
    reporterOutFile = path.join(__dirname, 'output.xml'),

    filePass = path.join(fixtures, 'pass.scss'),
    fileFail = path.join(fixtures, 'fail.scss'),
    fileFail2 = path.join(fixtures, 'fail2.scss');

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
      expect(results[2]).to.contain('Color literals like `black` should only be used in variable declarations');
      expect(results[3]).to.contain('Color `black` should be written in hexadecimal form as `#000000`');
      expect(results[4]).to.contain('Files should end with a trailing newline');
      expect(results.length).to.be(5);
    });
  });

  it('pass', function () {
    scsslint.lint(filePass, defaultOptions, function (results) {
      expect(results).to.not.be.ok();
    });
  });

  it('pass with force', function (done) {
    var muted = grunt.log.muted,
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

    scsslint.lint(fileFail, testOptions, function (results) {
      grunt.option('debug', undefined);
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;
      expect(_.last(stdout)).to.contain('scss-lint failed, but was run in force mode');
      done();
    });
  });

  it('debug option', function (done) {
    var muted = grunt.log.muted,
        stdoutMsg = '';

    grunt.log.muted = false;

    hooker.hook(process.stdout, 'write', {
      pre: function (result) {
        stdoutMsg += grunt.log.uncolor(result);
        return hooker.preempt();
      }
    });

    grunt.option('debug', true);

    scsslint.lint(filePass, defaultOptions, function () {
      grunt.option('debug', undefined);
      hooker.unhook(process.stdout, 'write');
      grunt.log.muted = muted;

      expect(stdoutMsg).to.contain('Run command: scss-lint');
      done();
    });
  });

  it('bundle exec', function (done) {
    var testOptions;

    testOptions = _.assign({}, defaultOptions, {
      bundleExec: true
    });

    scsslint.lint(filePass, testOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('pass with excluded file', function (done) {
    var files = path.join(fixtures, '*.scss'),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      exclude: [fileFail, fileFail2]
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
    scsslint.lint([filePass, filePass, filePass], defaultOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('reporter', function (done) {
    var testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(fileFail, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);
      results = results.split('\n');

      expect(report).to.contain(results[0]);
      expect(report).to.contain('errors="5"');
      done();
    });
  });

  it('reporter errors', function (done) {
    var testOptions;

    testOptions = _.assign({}, defaultOptions, {
      reporterOutput: reporterOutFile
    });

    scsslint.lint(filePass, testOptions, function (results) {
      var report = grunt.file.read(reporterOutFile);

      expect(report).to.contain('errors="0"');
      done();
    });
  });

  it('colourise output', function (done) {
    var testOptions;

    ['colouriseOutput', 'colorizeOutput'].forEach(function (prop) {
      testOptions = _.assign({}, defaultOptions);
      testOptions[prop] = true;

      scsslint.lint(fileFail, testOptions, function (results) {
        var styles = chalk.styles;
        results = results.split('\n')[0];

        expect(results).to.contain(styles.cyan.open + fileFail);
        expect(results).to.contain(styles.magenta.open + '1');
        expect(results).to.contain(styles.yellow.open + '[W]');
        done();
      });
    });
  });

  it('compact without colour', function () {
    var testOptions;

    ['colouriseOutput', 'colorizeOutput'].forEach(function (prop) {
      testOptions = _.assign({}, defaultOptions, {
        compact: true
      });
      testOptions[prop] = false;

      scsslint.lint([fileFail, fileFail2], testOptions, function (results) {
        results = results.split('\n');

        expect(results[1]).to.contain(fileFail);
        expect(results[2]).to.contain('1:');
        expect(typeof(/\:\s(.+)/.exec(results[2])[1])).to.be('string');
        expect(results[8]).to.contain(fileFail2);
      });
    });
  });

  it('compact with colour', function () {
    var testOptions;

    testOptions = _.assign({}, defaultOptions, {
      compact: true
    });

    scsslint.lint([fileFail, fileFail2], testOptions, function (results) {
      var styles = chalk.styles;
      results = results.split('\n');

      expect(results[1]).to.contain(styles.cyan.open + fileFail);
      expect(results[2]).to.contain(styles.magenta.open + '1' + styles.magenta.close + ':');
      expect(typeof(new RegExp(escapeRe(styles.magenta.close) + '\\:\\s(.+)').exec(results[2])[1])).to.be('string');
      expect(results[8]).to.contain(styles.cyan.open + fileFail2);
    });
  });

  it('pluralise single file', function () {
    scsslint.lint(filePass, defaultOptions, function (results) {
      expect(results).to.contain('1 file is lint free');
    });
  });

  it('pluralise multiple files', function () {
    var files = [filePass, filePass];

    scsslint.lint(files, defaultOptions, function (results) {
      expect(results).to.contain(files.length + ' files are lint free');
    });
  });

  it('emit error', function () {
    var eventSpy = sinon.spy(),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      emitError: true
    });

    grunt.event.on('scss-lint-error', eventSpy);

    scsslint.lint(fileFail, testOptions, function (results) {
      results = results.split('\n');

      expect(results.length).to.be(5);
      expect(eventSpy.called).to.be.ok();
    });
  });

  it('emit success', function () {
    var eventSpy = sinon.spy(),
        testOptions;

    testOptions = _.assign({}, defaultOptions, {
      emitSuccess: true
    });

    grunt.event.on('scss-lint-success', eventSpy);

    scsslint.lint(filePass, testOptions, function (results) {
      expect(eventSpy.called).to.be.ok();
    });
  });

  it('exit code on failure', function (done) {
    grunt.util.spawn({
      cmd: 'grunt', 
      args: ['scsslint']
    }, function (error, result, code) {
      expect(code).not.to.be(0);
      done();
    });
  });

  it('exit code and output on missing ruby', function () {
    var nockExec = require('nock-exec'),
        proxyquire = require('proxyquire'),
        linter = proxyquire('../tasks/lib/scss-lint', {
          'child_process': nockExec.moduleStub
        }).init(grunt);

    nockExec('scss-lint ' + filePass)
      .exit(127);
    linter.lint(filePass, {
      bundleExec: false
    }, function (results) {
      expect(results).to.contain('1. Please make sure you have ruby installed: `ruby -v`');
      expect(results).to.contain('2. Install the `scss-lint` gem by running:');
      expect(results).to.contain('gem update --system && gem install scss-lint');
    });
  });

  it('exit code on success', function (done) {
    grunt.util.spawn({
      cmd: 'grunt', 
      args: ['scsslint:success']
    }, function (error, result, code) {
      expect(code).to.be(0);
      done();
    });
  });

  it('max buffer', function (done) {
    var testOptions;

    testOptions = _.assign({}, defaultOptions, {
      maxBuffer: false
    });

    scsslint.lint(fileFail, testOptions, function (results) {
      expect(results).not.to.be.ok();
      done();
    });
  });
});
