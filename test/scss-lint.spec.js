var _ = require('lodash'),
    chalk = require('chalk'),
    expect = require('expect.js'),
    fs = require('fs'),
    nockExec = require('nock-exec'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    
    escapeRe = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    grunt = require('grunt'),
    hooker = grunt.util.hooker,
    spawn = grunt.util.spawn,

    path = require('path'),
    fixtures = path.join(__dirname, 'fixtures'),
    defaultOptions = {},
    reporterOutFile = path.join(process.cwd(), 'scss-lint-report.xml'),

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

  it('fail', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:fail']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('Warning: Task "scsslint:fail" failed.');
      done();
    });
  });

  it('pass', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:pass']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('1 file is lint free');
      expect(results).to.contain('Done, without errors.');
      done();
    });
  });

  it('pass with force', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:force']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('scss-lint failed, but was run in force mode');
      expect(results).to.contain('Done, without errors.');
      done();
    });
  });

  it('debug option', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:pass', '--debug']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('Run command: scss-lint');
      done();
    });
  });

  it('bundle exec', function (done) {
    var instance = nockExec('bundle exec scss-lint ' + filePass).exit(0),
        scsslint = proxyquire('../tasks/lib/scss-lint', {
          child_process: nockExec.moduleStub
        }).init(grunt);

    testOptions = _.assign({}, defaultOptions, {
      bundleExec: true
    });

    scsslint.lint(filePass, testOptions, function (results) {
      expect(instance.ran()).to.be.ok();
      done();
    });
  });

  it('pass with excluded file', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:exclude']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('1 file is lint free');
      expect(results).to.contain('Done, without errors.');
      done();
    });
  });

  it('fail with bad options', function (done) {
    var files = '--incorrectlySpecifyingAnOptionAsAFile',
        scsslint = require('../tasks/lib/scss-lint').init(grunt);;

    scsslint.lint(files, defaultOptions, function (results) {
      expect(results).to.not.be.ok();
      done();
    });
  });

  it('multiple files', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:multiple']
    }, function (error, results, code) {
      results = results.stdout;
      expect(results).to.contain('1 file is lint free');
      expect(results).to.contain('Done, without errors.');
      done();
    });
  });

  it('reporter with errors', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:fail']
    }, function (error, results, code) {
      var report = grunt.file.read(reporterOutFile);

      expect(report).to.contain('errors="5"');
      done();
    });
  });

  it('reporter without errors', function (done) {
    spawn({
      cmd: 'grunt',
      args: ['scsslint:pass']
    }, function (error, results, code) {
      var report = grunt.file.read(reporterOutFile);

      expect(report).to.contain('errors="0"');
      done();
    });
  });

  describe('colourised output', function () {
    ['colouriseOutput', 'colorizeOutput'].forEach(function (task) {
      it(task, function (done) {
        spawn({
          cmd: 'grunt',
          args: ['scsslint:' + task]
        }, function (error, results, code) {
          var styles = chalk.styles;
          results = results.stdout.split('\n')[2];

          expect(results).to.contain(styles.cyan.open + fileFail.replace(process.cwd() + '/', ''));
          expect(results).to.contain(styles.magenta.open + '1');
          expect(results).to.contain(styles.yellow.open + '[W]');
          done();
        });
      });
    });
  });

  describe('compact without colour', function () {
    ['ColouriseOutput', 'ColorizeOutput'].forEach(function (task) {
      it(task, function (done) {
        spawn({
          cmd: 'grunt',
          args: ['scsslint:compactWithout' + task]
        }, function (error, results, code) {
          var styles = chalk.styles;
          results = results.stdout.split('\n');

          expect(results[3]).to.contain(fileFail.replace(process.cwd() + '/', ''));
          expect(results[4]).to.contain('1: [W] SelectorFormat:');
          done();
        });
      });
    });
  });

  describe('compact with colour', function () {
    ['ColouriseOutput', 'ColorizeOutput'].forEach(function (task) {
      it(task, function (done) {
        spawn({
          cmd: 'grunt',
          args: ['scsslint:compactWith' + task]
        }, function (error, results, code) {
          var styles = chalk.styles;
          console.log(results.stdout);
          results = results.stdout.split('\n');

          expect(results[3]).to.contain(styles.cyan.open + fileFail.replace(process.cwd() + '/', ''));
          expect(results[4]).to.contain(styles.magenta.open + '1' + styles.magenta.close + ':');
          done();
        });
      });
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
    spawn({
      grunt: true,
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

  xit('exit code on success', function (done) {
    spawn({
      grunt: true,
      cmd: 'grunt', 
      args: ['scsslint:success']
    }, function (error, result, code) {
      expect(code).to.be(0);
      done();
    });
  });

  xit('max buffer', function (done) {
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
