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
