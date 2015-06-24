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

// constants
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var BUILD_DIR = 'build';
var PACKAGE_JSON = 'package.json';


/**
 * @param grunt the grunt instance
 * @param serverName defaults to spot currently, but sometimes rintintin is used
 */
module.exports = function( grunt, serverName ) {
  'use strict';

  // check prerequisite files
  if ( !grunt.file.exists( PACKAGE_JSON ) ) {
    grunt.log.writeln( 'Cannot find ' + PACKAGE_JSON );
    process.exit();
  }

  if ( !grunt.file.exists( BUILD_DIR ) ) {
    grunt.log.writeln( 'Cannot find ' + BUILD_DIR );
    process.exit();
  }

  // get the sim name and version
  var directory = process.cwd();
  var directoryComponents = directory.split( '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];
  var version = grunt.file.readJSON( 'package.json' ).version;

  // try to get spot credentials from credentials.json file
  var credentials;
  try {
    credentials = grunt.file.readJSON( '../chipper/credentials.json' ); // put this file in js/build-sever/ with your spot login info
  }
  catch( e ) {
    grunt.log.writeln( 'ERROR: SCP credentials for deploying to spot not found. ' +
                       'Please create a file "credentials.json" in chipper root with fields for "username" and "password"' );
  }

  if ( credentials ) {
    var done = grunt.task.current.async();

    var path = DEV_DIRECTORY + sim + '/';
    var credentialsObject = {
      host: serverName + '.colorado.edu',
      username: credentials.username,
      password: credentials.password,
      path: path + version + '/'
    };

    grunt.log.writeln( 'Copying files to ' + serverName + '...' );

    // scp will mkdir automatically if necessary
    client.scp( 'build', credentialsObject, function( err ) {
      if ( err ) {
        grunt.log.writeln( 'SCP failed with error: ' + err );
      }
      else {
        grunt.log.writeln( 'SCP ran successfully' );
      }

      grunt.log.writeln( 'Attempting to write .htaccess file in ' + path );

      // write .htaccess in the sim directory
      // it is easier to just overwrite it every time than to test if it exists and then write
      var sshClient = new client.Client( credentialsObject );
      sshClient.write( {
        destination: path + '.htaccess',
        content: new Buffer( HTACCESS_TEXT )
      }, function( err ) {
        if ( err ) {
          grunt.log.writeln( err );
        }
        else {
          grunt.log.writeln( '.htaccess file written successfully' );
        }

        grunt.log.writeln( 'updating dependencies.json' );
        grunt.file.copy( 'build/dependencies.json', 'dependencies.json' );

        var exec = function( command, callback ) {
          child_process.exec( command, function( err, stdout, stderr ) {
            grunt.log.writeln( stdout );
            grunt.log.writeln( stderr );
            assert( err, 'assertion error running ' + command );
            callback();
          } );
        };

        exec( 'git add dependencies.json', function() {
          exec( 'git commit --message "updated dependencies.json for ' + version + ' "', function() {
            exec( 'git push', function() {
              done();
            } );
          } );
        } );
        
      } );
    } );
  }
};
