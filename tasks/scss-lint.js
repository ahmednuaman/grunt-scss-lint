module.exports = function (grunt) {
  var _ = require('lodash'),
      scsslint = require('./lib/scss-lint').init(grunt);

  grunt.registerMultiTask('scsslint', 'Validate `.scss` files with `scss-lint`.', function () {
    var done = this.async(),
        files = this.filesSrc,
        fileCount = this.filesSrc.length,
        target = this.target,
        opts,
        message;

    opts = this.options({
      config: '.scss-lint.yml',
      reporterOutput: null,
      bundleExec: false,
      colorizeOutput: true,
      compact: false,
      force: false,
      maxBuffer: 300 * 1024
    });

    grunt.verbose.writeflags(opts, 'scss-lint options');

    grunt.log.writeln('Running scss-lint on ' + target);

    scsslint.lint(files, opts, function (results) {
      if (results === false) {
        done(false);
      } else {
        done(_.isEmpty(results) || opts.force);
      }
    });
  });
};
