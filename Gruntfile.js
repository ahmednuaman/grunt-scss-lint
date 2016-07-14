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

    'mocha_istanbul': {
      tests: ['test/**/*.js'],
      options: {
        timeout: 10000,
        quiet: true, // output confuses AppVeyor
        mochaOptions: ['--no-exit']
      }
    },

    scsslint: {
      all: [
        'test/fixtures/*.scss'
      ],
      pass: [
        'test/fixtures/pass.scss'
      ],
      fail: [
        'test/fixtures/fail.scss'
      ],
      multiple: [
        'test/fixtures/pass.scss',
        'test/fixtures/pass2.scss',
        'test/fixtures/pass.scss'
      ],
      force: {
        options: {
          force: true
        },
        src: ['test/fixtures/fail.scss']
      },
      exclude: {
        options: {
          exclude: [
            'test/fixtures/fail.scss',
            'test/fixtures/fail2.scss'
          ]
        },
        src: ['test/fixtures/pass.scss']
      },
      passcheckstyle: {
        options: {
          format: 'Checkstyle',
          require: 'scss_lint_reporter_checkstyle'
        },
        src: ['test/fixtures/pass.scss']
      },
      options: {
        reporterOutput: 'scss-lint-report.xml'
      }
    },

    watch: {
      test: {
        files: ['<%= jshint.all %>', '<%= mocha_istanbul.tests %>'],
        tasks: ['test'],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('test', ['jscs', 'jshint', 'mocha_istanbul']);
};
