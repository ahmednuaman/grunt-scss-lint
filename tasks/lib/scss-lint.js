exports.init = function (grunt) {
  var _ = require('lodash'),
      exports = {},
      compact = {},
      xmlBuilder = require('xmlbuilder'),
      chalk = require('chalk'),
      writeReport;

  writeReport = function (output, results) {
    var files = {},
        file,
        spec,
        xml;

    if (!output) {
      return;
    }

    results = (results.length !== 0) ? results.split('\n') : [];

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

  compact = {
    make: function (results) {
      var output = {},
          fileName = '',
          matchesRe = /^(.+?\.scss)\:(\d+?)\s(\[\w+?\])\s(.+)/,
          matches;

      results = chalk.stripColor(results);
      results = results.length !== 0 ? results.split('\n') : [];

      _.forEach(results, function (result) {
        if (result === '') {
          return false;
        }

        matches = matchesRe.exec(result);

        if (matches) {
          if (fileName !== matches[1]) {
            fileName = matches[1];
            output[fileName] = [];
          }

          output[fileName].push({
            line: matches[2],
            type: matches[3],
            description: matches[4]
          });
        }
      });

      return output;
    },
    output: function (results) {
      var str = '',
          iterateErrors;

      iterateErrors = function (errors) {
        var errorMsg = '';

        _.forEach(errors, function (error) {
          errorMsg += '  ' + chalk.magenta(error.line) + ': ' + error.description + '\n';
        });

        return errorMsg;
      };

      results = compact.make(results);

      _.forEach(results, function (result, index, collection) {
        str += '\n';
        str += chalk.bold(index);
        str += '\n';
        str += iterateErrors(result);
      });

      return str;
    }
  };

  exports.lint = function (files, options, done) {
    var args = [],
        config = options['config'],
        exclude = options['exclude'],
        exec = require('child_process').exec,
        env = process.env,
        fileCount = Array.isArray(files) ? files.length : 1,
        child;

    args.push('scss-lint');

    if (options.bundleExec) {
      args.unshift('bundle', 'exec');
    }

    if (config) {
      args.push('-c');
      args.push(config);
    }

    if (exclude) {
      args.push('-e');
      args.push(grunt.file.expand(exclude).join(','));
    }

    if (options.colorizeOutput) {
      env.CLICOLOR_FORCE = '1';
    }

    args = args.concat(files);

    if (grunt.option('debug') !== undefined) {
      grunt.log.debug('Run command: ' + args.join(' '));
    }

    child = exec(args.join(' '), {
      maxBuffer: options.maxBuffer,
      cwd: process.cwd(),
      env: env
    }, function (err, results, code) {
      var message,
      rawResults;

      if (err && err.code !== 1 && err.code !== 2 && err.code !== 65) {
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

      results = results.trim();
      rawResults = results;

      if (results && options.compact) {
        results = compact.output(results);
        if (!options.colorizeOutput) {
          results = chalk.stripColor(results);
        }
      }

      if (!results) {
        message = fileCount + grunt.util.pluralize(fileCount, ' file is lint free/ files are lint free');
        grunt.log.oklns(message);
      } else {
        if (!options.emitError) {
          grunt.log.writeln(results);
        } else {
          grunt.event.emit('scss-lint-error', results);
        }
        if (options.force) {
          grunt.log.writeln('scss-lint failed, but was run in force mode');
        }
      }

      if (options.reporterOutput) {
        writeReport(options.reporterOutput, grunt.log.uncolor(rawResults));
        grunt.log.writeln('Results have been written to: ' + options.reporterOutput);
      }

      done(results);
    });
  };

  return exports;
};
