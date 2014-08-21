module.exports = function (grunt) {
  grunt.initConfig({
    jscs: {
      src: ['<%= jshint.all %>'],
      options: {
        config: '.jscsrc'
      }
    },

    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        'test/**/*.js'
      ],
      options: {
        jshintrc: true
      }
    },

    scsslint: {
      all: [
        'test/fixtures/fail.scss',
        'test/fixtures/pass.scss',
        'test/fixtures/*.scss'
      ],
      success: [
        'test/fixtures/pass.scss'
      ],
      options: {
        config: '.scss-lint.yml',
        reporterOutput: 'scss-lint-report.xml',
        bundleExec: false,
        colorizeOutput: true,
        compact: true
      },
      force: {
        options: {
          config: '.scss-lint.yml',
          force: true
        },
        files: [{
          src: [
            'test/fixtures/fail.scss'
          ]
        }]
      }
    },

    nodeunit: {
      tests: ['test/*-test.js']
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-internal');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('test', ['jscs', 'jshint', 'nodeunit']);

  grunt.registerTask('default', ['test']);
};
