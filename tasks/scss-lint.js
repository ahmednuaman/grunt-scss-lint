module.exports = function (grunt) {
  var _ = require('lodash'),
      scsslint = require('./lib/scss-lint').init(grunt);

  grunt.registerMultiTask('scsslint', 'Validate `.scss` files with `scss-lint`.', function() {
    var done = this.async(),
        files = this.filesSrc,
        fileCount = this.filesSrc.length,
        target = this.target,
        opts;

    opts = this.options({
      config: '.scss-lint.yml',
      reporterOutput: null
    });

    grunt.verbose.writeflags(opts, 'scss-lint options');

    grunt.log.writeln('Running scss-lint on ' + target);

    scsslint.lint(files, opts, function (results) {
      var success = results[0] === '';

      if (success) {
        grunt.log.oklns(fileCount + ' files are lint free');
      } else {
        _.forEach(results, function(result) {
          grunt.log.writeln(result);
        });
      }

      if (opts.reporterOutput) {
        grunt.log.writeln('Results have been written to: ' + opts.reporterOutput);
      }

      done(success);
    });
  });
};