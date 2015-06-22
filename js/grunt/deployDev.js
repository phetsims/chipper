// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation to spot.
 *
 * @author Aaron Davis
 */

/* jslint node: true */

// modules
var client = require( 'scp2' );

// constants
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';


/**
 * @param grunt the grunt instance
 * @param serverName defaults to simian currently
 */
module.exports = function( grunt, serverName ) {
  'use strict';

  var directory = process.cwd();
  var directoryComponents = directory.split( '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];

  var version = grunt.file.readJSON( 'package.json' ).version;
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
    grunt.log.writeln( path );

    var credentialsObject = {
      host: serverName + '.colorado.edu',
      username: credentials.username,
      password: credentials.password
    };

    grunt.log.writeln( 'Copying files to ' + serverName + '...' );

    credentialsObject.path = path + version + '/';

    // scp will mkdir if automatically if necessary
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
        done();
      } );
    } );
  }
};
