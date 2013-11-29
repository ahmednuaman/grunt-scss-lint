module.exports = function (grunt) {
  grunt.registerMultiTask('scsslint', 'Validate `.scss` files with `scss-lint`.', function() {
    var done = this.async(),
        output = '',
        opts;

    opts = this.options({
      config: '.scss-lint.yml',
      reporterOutput: 'scss-lint-report.xml'
    });

    grunt.verbose.writeflags(options, 'scss-lint options');
  });
};