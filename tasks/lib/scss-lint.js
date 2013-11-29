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
    })

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
        child;

    // if (config) {
    //   args.push('-c');
    //   args.push(config);
    // }

    args.push(files);

    child = grunt.util.spawn({
      cmd: 'scss-lint',
      args: args
    }, function(err, results, code) {
      results = results.stdout.split("\n");

      if (code === 127) {
        grunt.log.errorlns('Please make sure you install the `scss-lint` gem.');

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
}