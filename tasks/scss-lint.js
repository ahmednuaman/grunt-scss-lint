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
      bundleExec: false,
      colouriseOutput: false,
      colorizeOutput: false,
      compact: false,
      force: false,
      maxBuffer: 300 * 1024
    });

    if (opts.bundleExec) {
      checkBinary('bundle',
        'bundleExec options set but no Bundler executable found in your PATH.'
      );
    } else {
      checkBinary('scss-lint',
        'You need to have Ruby and sscs_lint installed and in your PATH for this task to work.'
      );
    }

    grunt.verbose.writeflags(opts, 'scss-lint options');
    grunt.log.writeln('Running scss-lint on ' + target);

    scsslint.lint(files, opts, function (results) {
      if (opts.force || !results) {
        done();
      } else {
        done(false);
      }
    });
  });
};
