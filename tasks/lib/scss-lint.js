var _ = require('lodash'),
    chalk = require('chalk'),
    xmlBuilder = require('xmlbuilder');

exports.init = function (grunt) {
  var
      exports = {},
      compact = {},
      exec = require('child_process').exec,
      writeReport;

  writeReport = function (output, results, format) {
    var files = {},
        file,
        spec,
        xml;

    if (!output) {
      return;
    }

    if (format == 'txt') {
      grunt.file.write(output, results);
    } else {
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
    }
  };

  compact = {
    make: function (results) {
      var output = {},
          fileName = '',
          matchesRe = /^(.+?\.scss)\:(\d+?)\:(?:\d+?)\s(\[\w+?\])\s(.+)/,
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
            description: matches[4].split(':')
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
          if (error.type === '[W]') {
            errorMsg += '  ' +
                        chalk.magenta(error.line) + ': ' +
                        chalk.yellow(error.type) + ' ' +
                        chalk.green(error.description[0]) + ': ' +
                        error.description[1] + '\n';
          } else {
            errorMsg += '  ' +
                        chalk.magenta(error.line) + ': ' +
                        chalk.red(error.type) + ' ' +
                        chalk.green(error.description[0]) + ': ' +
                        error.description[1] + '\n';
          }
        });

        return errorMsg;
      };

      results = compact.make(results);

      _.forEach(results, function (result, index, collection) {
        str += '\n';
        str += chalk.cyan.bold(index);
        str += '\n';
        str += iterateErrors(result);
      });

      return str;
    }
  };

  exports.lint = function (files, options, done) {
    var args = [],
        env = process.env,
        fileCount = _.isArray(files) ? files.length : 1,
        child;

    args.push('scss-lint');

    if (options.bundleExec) {
      args.unshift('bundle', 'exec');
    }

    if (options.gemVersion) {
      args.push('"_' + options.gemVersion + '_"');
    }

    if (options.config) {
      args.push('-c');
      args.push(options.config);
    }

    if (options.exclude) {
      args.push('-e');
      args.push(grunt.file.expand(options.exclude).join(','));
    }

    if (options.require) {
      args.push('-r');
      args.push(options.require);
    }

    if (options.format) {
      args.push('-f');
      args.push(options.format);

      // if using an output file with an explicit formatter,
      // send the output directly to that file via the -o parameter.
      if (options.reporterOutput) {
        args.push('-o');
        args.push(options.reporterOutput);
      }
    }

    options.colorizeOutput = options.colorizeOutput || options.colouriseOutput;

    if (options.colorizeOutput) {
      env.FORCE_COLOR = '1';
      args.push('--color');
    } else {
      args.push('--no-color');
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
          rawResults,
          failed = true;

      if (err && err.code !== 1 && err.code !== 2 && err.code !== 65) {
        if (err.code === 127) {
          grunt.log.errorlns('1. Please make sure you have ruby installed: `ruby -v`');
          grunt.log.errorlns('2. Install the `scss-lint` gem by running:');
          grunt.log.errorlns('gem update --system && gem install scss-lint');
        } else {
          grunt.log.errorlns('scss-lint failed with error code: ' + err.code);
          grunt.log.errorlns('and the following message:' + err);
        }

        return done(false, results);
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
        if (!options.emitSuccess) {
          message = fileCount + grunt.util.pluralize(fileCount, ' file is lint free/ files are lint free');
          grunt.log.oklns(message);
        } else {
          grunt.event.emit('scss-lint-success');
        }
        failed = false;
      } else {
        if (!options.emitError) {
          grunt.log.writeln(results);
        } else {
          grunt.event.emit('scss-lint-error', results);
        }
        if (options.force) {
          failed = false;
          grunt.log.writeln('scss-lint failed, but was run in force mode');
        } else if (err && err.code === 1 && !options.failOnWarning) { // we have just warnings
          failed = false;
        }
      }

      if (options.reporterOutput) {
        // Force a format if the option is set. If not use the file extenion from the output file
        var format = options.reporterOutputFormat || options.reporterOutput.split(/[. ]+/).pop();

        // if an explicit formatter was used, the output is already sent to the output file,
        // no need to write the report
        if (!options.format) {
          writeReport(options.reporterOutput, grunt.log.uncolor(rawResults), format);
        }

        grunt.log.writeln('Results have been written to: ' + options.reporterOutput);
      }

      done(failed, results);
    });
  };

  return exports;
};
