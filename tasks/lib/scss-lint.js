exports.init = function (grunt) {
  var _ = require('lodash'),
      exports = {},
      xmlBuilder = require('xmlbuilder'),
      writeReport;

  writeReport = function (output, results) {
    var files = {},
        file,
        spec,
        xml;

    if (!output) {
      return;
    }

    xml = xmlBuilder.create('testsuites');

    xml.ele('testsuite', {
      name: 'scss-lint',
      timestamp: (new Date()).toISOString().substr(0, 19)
    });

    xml.att('errors', results.length);

    _.forEach(results, function (result) {
      if (!result) {
        return;
      }

      file = result.match(/^([^:])+/)[0];

      if (!files[file]) {
        files[file] = [];
      }

      files[file].push(result);
    });

    _.forEach(files, function (fileErrors, fileName) {
      spec = xml.ele('testcase', {
        name: fileName
      });

      _.forEach(fileErrors, function (error) {
        spec.ele('failure', {}, error);
      });
    });

    grunt.file.write(output, xml.end());
  };

  exports.lint = function (files, options, done) {
    var args = [],
        config = options['config'],
        exclude = options['exclude'],
        exec = require('child_process').exec,
        child;

    if (config) {
      args.push('-c');
      args.push(config);
    }

    if (exclude) {
      args.push('-e');
      args.push(grunt.file.expand(exclude).join(','));
    }

    args = args.concat(files);

    child = exec('scss-lint ' + args.join(' '), {
      cwd: process.cwd()
    }, function(err, results, code) {
      results = results.split("\n");

      if (err && err.code !== 65) {
        if (err.code === 127) {
          grunt.log.errorlns('1. Please make sure you have ruby installed: `ruby -v`');
          grunt.log.errorlns('2. Install the `scss-lint` gem by running:');
          grunt.log.errorlns('gem update --system && gem install scss-lint');
        } else {
          grunt.log.errorlns('scss-lint failed with error code: ' + err.code);
          grunt.log.errorlns('and the following message:' + err);
        }

        return done(false);
      }

      writeReport(options['reporterOutput'], results);

      done(results);
    });

    child.stdout.on('write', function (out) {
      grunt.log.writeln(out);
    });
  };

  return exports;
};
