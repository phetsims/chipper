// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation to spot.
 *
 * @author Aaron Davis
 */

/* jslint node: true */

// modules
var client = require( 'scp2' );
var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// constants
var DEV_SERVER = 'spot.colorado.edu';
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var BUILD_DIR = 'build';
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'dependencies.json';

var TEST_SCP = false; // set to true to disable commit and push, and SCP to a test directory on spot

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

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
  if ( TEST_SCP ) { basePath += 'ad-tests/'; }

  // get the sim name and version
  var directory = process.cwd();
  var directoryComponents = directory.split( '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];
  var version = grunt.file.readJSON( PACKAGE_JSON ).version;

  var done = grunt.task.current.async();

  var path = basePath + sim + '/';
  var credentialsObject = {
    host: server,
    username: preferences.devUsername,
    password: preferences.devPassword,
    path: path + version + '/'
  };

  // write .htaccess in the sim directory
  // it is easier to just overwrite it every time than to test if it exists and then write
  var createHtaccessFile = function( callback ) {
    grunt.log.writeln( 'Attempting to write .htaccess file in ' + path );

    var sshClient = new client.Client( credentialsObject );
    sshClient.write( {
      destination: path + '.htaccess',
      content: new Buffer( HTACCESS_TEXT )
    }, function( err ) {
      if ( err ) {
        grunt.log.error( 'error writing .htaccess file ' + err );
      }
      else {
        grunt.log.writeln( '.htaccess file written successfully' );
      }
      callback();
    } );

  };

  grunt.log.writeln( 'Copying files to ' + server + '...' );

  // scp will mkdir automatically if necessary
  client.scp( BUILD_DIR, credentialsObject, function( err ) {
    if ( err ) {
      throw new Error( 'SCP failed with error: ' + err );
    }
    else {
      grunt.log.writeln( 'SCP ran successfully' );
    }

    grunt.log.writeln( 'updating ' + DEPENDENCIES_JSON );
    grunt.file.copy( BUILD_DIR + '/' + DEPENDENCIES_JSON, DEPENDENCIES_JSON );

    var exec = function( command, callback ) {
      child_process.exec( command, function( err, stdout, stderr ) {
        grunt.log.writeln( stdout );
        grunt.log.writeln( stderr );
        assert( !err, 'assertion error running ' + command );
        callback();
      } );
    };

    if ( !TEST_SCP ) {
      exec( 'git add ' + DEPENDENCIES_JSON, function() {
        exec( 'git commit --message "updated ' + DEPENDENCIES_JSON + ' for ' + version + ' "', function() {
          exec( 'git push', function() {
            createHtaccessFile( done );
          } );
        } );
      } );
    }
    else {
      createHtaccessFile( done );
    }

  } );
};
