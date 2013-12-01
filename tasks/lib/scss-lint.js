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
      file = result.match(/^([^:])+/)[0];

      if (!files[file]) {
        files[file] = [];
      }

      files[file].push(result);
    });

    _.forEach(files, function (fileErrors, fileName) {
      spec = xml.ele('testcase', {
        name: file
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
        spawn = require('child_process').spawn,
        child;

    // if (config) {
    //   args.push('-c');
    //   args.push(config);
    // }

    args = args.concat(files);

    child = spawn('scss-lint', args);

    child.stdout.on('data', function (data) {
      results = data.split("\n");

      writeReport(options['reporterOutput'], results);

      done(results);
    });

    child.stderr.on('data', function (data) {
      grunt.log.errorlns(data);
    });

    child.on('close', function (code) {
      if (code === 127) {
        grunt.log.errorlns('Please make sure you install the `scss-lint` gem.');

        return done(false);
      }
    });
  };

  return exports;
};