# grunt-scss-lint

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ahmednuaman/grunt-scss-lint?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ahmednuaman/grunt-scss-lint.png?branch=master)](https://travis-ci.org/ahmednuaman/grunt-scss-lint) [![Code Climate](https://codeclimate.com/github/ahmednuaman/grunt-scss-lint/badges/gpa.svg)](https://codeclimate.com/github/ahmednuaman/grunt-scss-lint) [![Test Coverage](https://codeclimate.com/github/ahmednuaman/grunt-scss-lint/badges/coverage.svg)](https://codeclimate.com/github/ahmednuaman/grunt-scss-lint) [![NPM version](https://badge.fury.io/js/grunt-scss-lint.png)](http://badge.fury.io/js/grunt-scss-lint)

> Lint your `.scss` files

## Getting Started
This plugin requires Grunt `>= 0.4.0` and [scss-lint](https://github.com/brigade/scss-lint) `>= 0.18.0`. It is recommended to use the `scss_lint` gem as that is the currently maintained version.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-scss-lint --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-scss-lint');
```

## Scss-lint task
_Run this task with the `grunt scsslint` command._

[scss-lint](https://github.com/brigade/scss-lint) is a Ruby gem written by [The Causes Engineering Team](https://github.com/causes). It is currently owned and maintained by [brigade](https://github.com/brigade). This plugin is simply a grunt wrapper for the gem.

This task requires you to have [Ruby](http://www.ruby-lang.org/en/downloads/), and [scss-lint](https://github.com/brigade/scss-lint#installation) installed. If you're on OS X or Linux you probably already have Ruby installed; test with `ruby -v` in your terminal. When you've confirmed you have Ruby installed, run `gem update --system && gem install scss_lint` to install the `scss_lint` gem.

### Options

#### bundleExec

- Type: `Boolean`
- Default: `false`

You can choose to have your gems installed via [bundler](http://bundler.io) and if so, set this option to `true` to use the local gems.

#### colorizeOutput

- Type: `Boolean`
- Default: `true`

Get some nice looking output.

For colors to work on Windows, you first need to install 2 extra gems. This is because  of [Rainbow](https://github.com/sickill/rainbow#windows-support), a dependency of [scss-lint](https://github.com/causes/scss-lint).

    gem install windows-pr win32console

#### compact

- Type: `Boolean`
- Default: `false`

Group related linted files for more easier error review. XML output will still be default from scss-lint.

#### config

- Type: `String`
- Default: `node_modules/grunt-scss-lint/.scss-lint.yml`.

Specify a configuration file.

#### gemVersion

- Type: `String`
- Default: `null`.

Specify a gem version for the scsslint gem.

#### exclude

- Type: `String` or `Array`
- Default: `null`

Exclude one or more files from being linted.

#### reporterOutput

- Type: `String`
- Default: `null`

The file to save the output to. If you don't want this then set the option as `null`.

#### reporterOutputFormat

- Type: `String`
- Default: `null`
- Options: `txt`, `xml`

This will ultimately default to the file extension used for `reporterOutput` if left `null`

#### emitError
- Type: `Boolean`
- Default: `false`

Emits a Grunt event on scss-lint error called `scss-lint-error`.

#### emitSuccess
- Type: `Boolean`
- Default: `false`

Emits a Grunt event on scss-lint success called `scss-lint-success`.

#### failOnWarning
- Type: `Boolean`
- Default: `true`

Disable to fail the task only on errors. You can set the severity level for individual linters in your configuration file.

#### force

- Type: `Boolean`
- Default: `false`

Set `force` to `true` to report scss-lint warnings and errors but not fail the task. This overrides `failOnWarning`.

#### maxBuffer

- Type: `Number` or `Boolean`
- Default: `300 * 1024`

Set `maxBuffer` for the `child_process.exec` process, [if you're linting a lot of files and you're recieving no output](https://github.com/ahmednuaman/grunt-scss-lint/issues/63) then you can try and increase this value. Setting it to `false`, `0`, `NaN` or `Infinite` will not return any `stdout` or `stderr` and the task will think that everything's fine.

### Usage Examples

#### Example config

```javascript
grunt.initConfig({
  scsslint: {
    allFiles: [
      'test/fixtures/*.scss',
    ],
    options: {
      bundleExec: true,
      config: '.scss-lint.yml',
      reporterOutput: 'scss-lint-report.xml',
      colorizeOutput: true
    },
  }
});

grunt.loadNpmTasks('grunt-scss-lint');

grunt.registerTask('default', ['scsslint']);
```

### Exit error codes
If you're having problems with the task exiting with an error code, then have a look here: [https://github.com/causes/scss-lint/blob/master/lib/scss_lint/cli.rb](https://github.com/causes/scss-lint/blob/master/lib/scss_lint/cli.rb)
