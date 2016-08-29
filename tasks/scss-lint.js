module.exports = function (grunt) {
  var _ = require('lodash'),
      scsslint = require('./lib/scss-lint').init(grunt),
      which = require('which'),
      checkBinary = function (cmd, errMsg) {
        try {
          which.sync(cmd);
        } catch (err) {
          return grunt.warn(
            '\n' + errMsg + '\n' +
            'More info: https://github.com/ahmednuaman/grunt-scss-lint\n'
          );
        }
      };

  grunt.registerMultiTask('scsslint', 'Validate `.scss` files with `scss-lint`.', function () {
    var done = this.async(),
        files = this.filesSrc,
        fileCount = this.filesSrc.length,
        target = this.target,
        opts,
        message;

    opts = this.options({
      config: null,
      gemVersion: null,
      reporterOutput: null,
      reporterOutputFormat: null,    
      bundleExec: false,
      colouriseOutput: false,
      colorizeOutput: false,
      compact: false,
      force: false,
      failOnWarning: true,
      maxBuffer: 300 * 1024,
      format: null,
      require: null
    });

    if (opts.bundleExec) {
      checkBinary('bundle',
        'bundleExec options set but no Bundler executable found in your PATH.'
      );
    } else {
      checkBinary('scss-lint',
        'You need to have Ruby and scss_lint installed and in your PATH for this task to work.'
      );
    }

    grunt.verbose.writeflags(opts, 'scss-lint options');
    grunt.log.writeln('Running scss-lint on ' + target);

    scsslint.lint(files, opts, function (failed, results) {
      if (opts.force || !failed) {
        done();
      } else {
        done(false);
      }
    });
  });
};
