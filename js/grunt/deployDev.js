// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation to spot.
 *
 * @author Aaron Davis
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// modules
var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// constants
var DEV_SERVER = 'spot.colorado.edu';
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';
var URL_BASE = 'http://www.colorado.edu/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var BUILD_DIR = 'build';
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'dependencies.json';

/**
 * @param grunt the grunt instance
 * @param simDir the sim directory path
 * @param mkdir set to true to create the sim dir and .htaccess file before copying the version directory
 * @param test set to true disable commit and push, and SCP to a test directory on spot
 */
module.exports = function( grunt, simDir, mkdir, test ) {

  // read the preferences file
  var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
  assert( fs.existsSync( PREFERENCES_FILE ), 'missing preferences file ' + PREFERENCES_FILE );
  var preferences = grunt.file.readJSON( PREFERENCES_FILE );

  // verify that preferences contains required entries
  assert( preferences.devUsername, 'devUsername is missing from ' + PREFERENCES_FILE );
  assert( preferences.devPassword, 'devPassword is missing from ' + PREFERENCES_FILE );

  // check prerequisite files
  assert( grunt.file.exists( PACKAGE_JSON ), 'Cannot find ' + PACKAGE_JSON );
  assert( grunt.file.exists( BUILD_DIR ), 'Cannot find ' + BUILD_DIR );

  // get the server name and server path if they are in the preferences file, otherwise use defaults
  var server = preferences.devDeployServer || DEV_SERVER;
  var basePath = preferences.devDeployPath || DEV_DIRECTORY;
  if ( test ) {
    basePath += 'ad-tests/';
    URL_BASE += 'ad-tests/';
  }

  // get the sim name and version
  var directory = simDir ? simDir : process.cwd();
  var directoryComponents = directory.split( ( /^win/.test( process.platform ) ) ? '\\' : '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];
  var version = grunt.file.readJSON( PACKAGE_JSON ).version;
  var simPath = basePath + sim;
  var versionPath = simPath + '/' + version;

  var done = grunt.task.current.async();

  var finish = function() {
    grunt.log.writeln( 'deployed: ' + URL_BASE + sim + '/' + version + '/' + sim + '_en.html' );
    done();
  };

  /**
   * Exec a command, log stdout and stderr, handle errors
   * @param command
   * @param callback
   */
  var exec = function( command, callback ) {
    grunt.log.writeln( 'Running command: ' + command );
    var execOptions = simDir ? { cwd: simDir } : {};
    child_process.exec( command, execOptions, function( err, stdout, stderr ) {
      if ( stdout ) { grunt.log.writeln( stdout ); }
      if ( stderr ) { grunt.log.writeln( stderr ); }
      assert( !err, 'assertion error running ' + command );
      callback();
    } );
  };

  /**
   * Copy dependencies.json to sim root, commit, and push
   * @param callback
   */
  var commitAndPush = function( callback ) {
    grunt.file.copy( BUILD_DIR + '/' + DEPENDENCIES_JSON, DEPENDENCIES_JSON );
    exec( 'git add ' + DEPENDENCIES_JSON, function() {
      exec( 'git commit --message "updated ' + DEPENDENCIES_JSON + ' for ' + version + ' "', function() {
        exec( 'git push', callback );
      } );
    } );
  };

  /**
   * scp file to dev server, and call commitAndPush if not testing
   */
  var scp = function() {
    exec( 'scp -r ' + BUILD_DIR + ' ' + preferences.devUsername + '@' + server + ':' + versionPath, function() {
      if ( test ) {
        finish();
      }
      else {
        commitAndPush( finish );
      }
    } );
  };

  if ( mkdir ) {
    var sshString = 'ssh ' + preferences.devUsername + '@' + server;
    var mkdirAndCreateHtaccessCommand = ' \'mkdir -p ' + simPath + ' && echo "' + HTACCESS_TEXT + '" > ' + simPath + '/.htaccess\'';
    exec( sshString + mkdirAndCreateHtaccessCommand, scp );
  }
  else {
    scp();
  }
};
