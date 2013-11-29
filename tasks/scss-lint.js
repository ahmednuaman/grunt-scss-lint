module.exports = function (grunt) {
  grunt.registerMultiTask('scsslint', 'Validate `.scss` files with `scss-lint`.', function() {
    var args = [],
        done = this.async(),
        output = '',
        child,
        opts;

    opts = this.options({
      config: '.scss-lint.yml',
      reporterOutput: 'scss-lint-report.xml'
    });

    grunt.verbose.writeflags(options, 'scss-lint options');

    child = grunt.util.spawn({
      cmd: 'scss-lint',
      args: args
    }, function(err, results, code) {
      console.log(code);
    });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
};