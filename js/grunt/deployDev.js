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

// constants
var DEV_SERVER = 'spot.colorado.edu';
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';
var URL_BASE = 'http://www.colorado.edu/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var BUILD_DIR = 'build';
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'dependencies.json';
var TEST_DIR_NAME = 'deploy-dev-tests';

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  // grunt options
  var mkdir = !!grunt.option( 'mkdir' ); // true = create the sim dir and .htaccess file before copying the version directory
  var test = !!grunt.option( 'test' ); // true = disable commit and push, and SCP to a test directory on spot

  // check prerequisite files
  assert( grunt.file.isDir( BUILD_DIR ), BUILD_DIR + ' directory does not exists' );

  // read the preferences file
  var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
  var preferences = grunt.file.readJSON( PREFERENCES_FILE );

  // verify that preferences contains required entries
  assert( preferences.devUsername, 'devUsername is missing from ' + PREFERENCES_FILE );

  // get the server name and server path if they are in the preferences file, otherwise use defaults
  var server = preferences.devDeployServer || DEV_SERVER;
  var basePath = preferences.devDeployPath || DEV_DIRECTORY;
  if ( test ) {
    basePath += TEST_DIR_NAME + '/';
    URL_BASE += TEST_DIR_NAME + '/';
  }

  // get the sim name and version
  var directory = process.cwd();
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
    child_process.exec( command , function( err, stdout, stderr ) {
      grunt.log.writeln( stdout );
      grunt.log.writeln( stderr );
      assert( !err, 'assertion error running ' + command + '. ' + err );
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
