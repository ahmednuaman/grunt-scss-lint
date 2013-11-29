module.exports = function(grunt) {
  grunt.initConfig({
    scsslint: {
      allFiles: [
        'test/fixtures/*.scss',
      ],
      individualFiles: {
        files: [
          {src: 'test/fixtures/pass.scss'},
          {src: 'test/fixtures/fail.scss'}
        ],
      },
      options: {
        config: '.scss-lint.yml',
        reporterOutput: 'scss-lint-report.xml'
      },
    },

    nodeunit: {
      tests: ['test/*-test.js'],
    },
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-internal');

  grunt.registerTask('test', ['scsslint', 'nodeunit']);

  grunt.registerTask('default', ['test', 'build-contrib']);
};