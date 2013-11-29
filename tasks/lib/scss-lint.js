exports.init = function (grunt) {
  var exports = {};

  exports.lint = function (files, options, done) {
    var args = [],
        config = options['config'],
        child;

    // if (config) {
    //   args.push('-c');
    //   args.push(config);
    // }

    args.push(files);

    child = grunt.util.spawn({
      cmd: 'scss-lint',
      args: args
    }, function(err, results, code) {
      if (code === 127) {
        grunt.log.errorlns('Please make sure you install the `scss-lint` gem.');

        return done(false);
      }

      done(results.stdout.split("\n"));
    });

    child.stdout.on('write', function (out) {
      grunt.log.writeln(out);
    });
  };

  return exports;
}