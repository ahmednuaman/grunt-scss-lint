var _ = require('lodash'),
    chalk = require('chalk'),
    expect = require('expect.js'),
    fs = require('fs'),
    proxyquire = require('proxyquire').noPreserveCache(),
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

/**
 * Mock implementation of the child_process module.
 * @param {String} expectedCommandLine - The expected command line.
 * Use method verify to ensure it was in fact as expected.
 * @param {Number} exitCode - The exit code the process is supposed to return, 0 if ommitted.
 */
function mockChildProcess(expectedCommandLine, exitCode) {
  var result = {
    /**
     * Simulates the exec method by directly calling the given callback.
     * Parameters commandLine and options are stored in the object for further reference.
     */
    exec: function (commandLine, options, callback) {
      var err = !exitCode ? null : {code: exitCode};
      result.commandLine = commandLine;
      result.options = options;
      callback(err, '', exitCode || 0);
    },

    /**
     * Verify that the command line used was the one expected.
     */
    verify: function () {
      expect(result.commandLine).to.equal(expectedCommandLine);
    }
  };

  return result;
}

/**
 * Mock the chalk module.
 * This is needed because in some environment specific cases (AppVeyor),
 * chalk thinks color is not supported and never works.
 */
function mockChalk() {
  // initialize the colors with support with null
  var result = {
    cyan: null,
    magenta: null,
    yellow: null,
    green: null
  };

  // this function creates a color
  function mockColor(color) {
    // the default color function
    var result = function (input) {
      return chalk.styles[color].open + input;
    };

    // supports also bold
    result.bold = function (input) {
      return chalk.styles[color].open + chalk.styles.bold.open + input;
    };

    return result;
  }

  // replace the null values with the color functions
  Object.keys(result).forEach(function (color) {
    result[color] = mockColor(color);
  });

  return result;
}

describe('grunt-scss-lint', function () {
  var sandbox,
      errorlnsStub,
      oklnsStub,
      writelnStub;

  beforeEach(function (done) {
    sandbox = sinon.sandbox.create();

    fs.stat(reporterOutFile, function (err, stats) {
      if (!err) {
        fs.unlink(reporterOutFile, done);
      } else {
        done();
      }
    });

    errorlnsStub = sandbox.stub(grunt.log, 'errorlns');
    oklnsStub = sandbox.stub(grunt.log, 'oklns');
    writelnStub = sandbox.stub(grunt.log, 'writeln');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('spawn tests', function () {
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
        expect(results).to.not.contain('errors');
        expect(results).to.contain('Done.');
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
        expect(results).to.not.contain('errors');
        expect(results).to.contain('Done.');
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

    it('pass with excluded file', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:exclude']
      }, function (error, results, code) {
        results = results.stdout;
        expect(results).to.contain('1 file is lint free');
        expect(results).to.not.contain('errors');
        expect(results).to.contain('Done.');
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

    it('reporter in checkstyle format', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:passcheckstyle']
      }, function (error, results, code) {
        var report = grunt.file.read(reporterOutFile);

        expect(report).to.contain('<checkstyle version=');
        expect(report).to.contain('</checkstyle>');
        done();
      });
    });

    it('pluralise single file', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:pass']
      }, function (error, results, code) {
        expect(results.stdout).to.contain('1 file is lint free');
        done();
      });
    });

    it('pluralise multiple files', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:multiple']
      }, function (error, results, code) {
        expect(results.stdout).to.contain('files are lint free');
        done();
      });
    });

    it('exit code on success', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:pass']
      }, function (error, result, code) {
        expect(code).to.be(0);
        done();
      });
    });

    it('exit code on failure', function (done) {
      spawn({
        cmd: 'grunt',
        args: ['scsslint:fail']
      }, function (error, result, code) {
        expect(code).not.to.be(0);
        done();
      });
    });
  });

  describe('mocked tests', function () {
    it('bundle exec', function (done) {
      var childProcessStub = mockChildProcess('bundle exec scss-lint --no-color ' + filePass),
          scsslint = proxyquire('../tasks/lib/scss-lint', {
            'child_process': childProcessStub
          }).init(grunt);

      testOptions = _.assign({}, defaultOptions, {
        bundleExec: true
      });

      scsslint.lint(filePass, testOptions, function (failed, results) {
        childProcessStub.verify();
        done();
      });
    });

    it('config file', function (done) {
      var configFile = path.join(fixtures, '.scss-lint-test.yml'),
        childProcessStub = mockChildProcess('scss-lint -c ' + configFile + ' --no-color ' + filePass),
          scsslint = proxyquire('../tasks/lib/scss-lint', {
            'child_process': childProcessStub
          }).init(grunt);

      testOptions = _.assign({}, defaultOptions, {
        config: configFile
      });

      scsslint.lint(filePass, testOptions, function (failed, results) {
        childProcessStub.verify();
        done();
      });
    });

    it('gem version', function (done) {
      var childProcessStub = mockChildProcess('scss-lint "_1.2.3_" --no-color ' + filePass),
        gemVersion = '1.2.3',
        scsslint = proxyquire('../tasks/lib/scss-lint', {
          'child_process': childProcessStub
        }).init(grunt);

      testOptions = _.assign({}, defaultOptions, {
        gemVersion: gemVersion
      });

      scsslint.lint(filePass, testOptions, function (failed, results) {
        childProcessStub.verify();
        done();
      });
    });

    it('max buffer', function (done) {
      var childProcessStub = mockChildProcess('hey'),
          scsslint = proxyquire('../tasks/lib/scss-lint', {
            'child_process': childProcessStub
          }).init(grunt),
          testOptions;

      testOptions = _.assign({}, defaultOptions, {
        maxBuffer: 100
      });

      scsslint.lint(filePass, testOptions, function () {
        expect(childProcessStub.options.maxBuffer).to.equal(100);
        done();
      });
    });

    it('exit code and output on missing ruby', function (done) {
      var childProcessStub = mockChildProcess('scss-lint ' + filePass, 127),
          scsslint = proxyquire('../tasks/lib/scss-lint', {
            'child_process': childProcessStub
          }).init(grunt);

      scsslint.lint(filePass, {
        bundleExec: false
      }, function (results) {
        expect(errorlnsStub.calledWith('1. Please make sure you have ruby installed: `ruby -v`')).to.equal(true);
        expect(errorlnsStub.calledWith('2. Install the `scss-lint` gem by running:')).to.equal(true);
        expect(errorlnsStub.calledWith('gem update --system && gem install scss-lint')).to.equal(true);
        done();
      });
    });
  });

  describe('require tests', function () {
    it('fail with bad options', function (done) {
      var files = '--incorrectlySpecifyingAnOptionAsAFile',
          scsslint = require('../tasks/lib/scss-lint').init(grunt);

      scsslint.lint(files, defaultOptions, function (failed, results) {
        expect(failed).to.not.be.ok();
        expect(errorlnsStub.getCall(0).args[0]).to.equal('scss-lint failed with error code: 64');
        done();
      });
    });

    describe('colourised output', function () {
      ['colouriseOutput', 'colorizeOutput'].forEach(function (task) {
        it(task, function (done) {
          var scsslint = require('../tasks/lib/scss-lint').init(grunt),
              testOptions;

          testOptions = _.assign({}, defaultOptions);
          testOptions[task] = true;

          scsslint.lint(fileFail, testOptions, function (failed, results) {
            var styles = chalk.styles;
            results = results.split('\n')[0];

            expect(results).to.contain(styles.cyan.open + fileFail);
            expect(results).to.contain(styles.magenta.open + '1');
            expect(results).to.contain(styles.yellow.open + '[W]');
            done();
          });
        });
      });
    });

    describe('compact without colour', function () {
      ['colouriseOutput', 'colorizeOutput'].forEach(function (task) {
        it(task, function (done) {
          var scsslint = require('../tasks/lib/scss-lint').init(grunt),
              testOptions;

          testOptions = _.assign({}, defaultOptions, {
            compact: true
          });
          testOptions[task] = false;

          scsslint.lint(fileFail, testOptions, function (failed, results) {
            var styles = chalk.styles;
            results = results.split('\n');

            expect(results[1]).to.contain(fileFail);
            expect(results[2]).to.contain('1: [W] SelectorFormat:');
            expect(results[1]).not.to.contain(styles.cyan.open + fileFail);
            expect(results[2]).not.to.contain(styles.magenta.open + '1');
            done();
          });
        });
      });
    });

    describe('compact with colour', function () {
      ['colouriseOutput', 'colorizeOutput'].forEach(function (task) {
        it(task, function (done) {
          var scsslint = proxyquire('../tasks/lib/scss-lint', {
            'chalk': mockChalk()
          }).init(grunt),
              testOptions;

          testOptions = _.assign({}, defaultOptions, {
            compact: true
          });
          testOptions[task] = true;

          scsslint.lint(fileFail, testOptions, function (failed, results) {
            var styles = chalk.styles;
            results = results.split('\n');

            expect(results[1]).to.contain(styles.cyan.open + styles.bold.open + fileFail);
            expect(results[2]).to.contain(styles.magenta.open + '1');
            done();
          });
        });
      });
    });

    it('emit error', function (done) {
      var eventSpy = sandbox.spy(),
          scsslint = require('../tasks/lib/scss-lint').init(grunt),
          testOptions;

      testOptions = _.assign({}, defaultOptions, {
        emitError: true
      });

      grunt.event.on('scss-lint-error', eventSpy);

      scsslint.lint(fileFail, testOptions, function (failed, results) {
        results = results.split('\n');
        expect(results.length).to.be(5);
        expect(eventSpy.calledOnce).to.be.ok();
        done();
      });
    });

    it('emit success', function (done) {
      var eventSpy = sandbox.spy(),
          scsslint = require('../tasks/lib/scss-lint').init(grunt),
          testOptions;

      testOptions = _.assign({}, defaultOptions, {
        emitSuccess: true
      });

      grunt.event.on('scss-lint-success', eventSpy);

      scsslint.lint(filePass, testOptions, function (failed, results) {
        expect(eventSpy.called).to.be.ok();
        done();
      });
    });
  });
});
