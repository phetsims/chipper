// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation by sending a request to our build-server.
 *
 * @author Aaron Davis
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// modules
var querystring = require( 'querystring' );
var request = require( 'request' );
var fs = require( 'fs' );
var assert = require( 'assert' );

// constants
var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
var DEFAULT_DEV_SERVER = 'spot.colorado.edu';
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'build/dependencies.json';
var PRODUCTION_SERVER_NAME = 'simian.colorado.edu';
var PRODUCTION_SERVER_URL = 'http://phet-dev.colorado.edu';

/**
 * @param grunt the grunt instance
 * @param devDeploy deploy to development server instead of production if true
 */
module.exports = function( grunt, devDeploy ) {
  devDeploy = !!devDeploy; // cast to boolean

  /**
   * Get the name of the development server. Defaults to spot.colorado.edu if there is no preferences file
   * and no field in preferences for devDeployServer.
   * @returns {string}
   */
  var getDevServerName = function() {
    if ( fs.existsSync( PREFERENCES_FILE ) ) {
      var preferences = grunt.file.readJSON( PREFERENCES_FILE );
      if ( preferences.devDeployServer ) {
        return preferences.devDeployServer;
      }
    }
    return DEFAULT_DEV_SERVER;
  };

  // get the sim name from the current directory
  var directory = process.cwd();
  var directoryComponents = directory.split( ( /^win/.test( process.platform ) ) ? '\\' : '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];

  // check prerequisite files
  assert( grunt.file.exists( PACKAGE_JSON ), 'Cannot find ' + PACKAGE_JSON );
  assert( grunt.file.exists( DEPENDENCIES_JSON ), 'Cannot find ' + DEPENDENCIES_JSON );

  var dependencies = grunt.file.readJSON( DEPENDENCIES_JSON );
  var version = grunt.file.readJSON( PACKAGE_JSON ).version;

  var query = querystring.stringify( {
    'repos': JSON.stringify( dependencies ),
    'locales': JSON.stringify( [ 'en' ] ),
    'simName': sim,
    'version': version,
    'serverName': ( devDeploy ) ? getDevServerName() : PRODUCTION_SERVER_NAME,
    'dev': devDeploy
  } );

  var url = PRODUCTION_SERVER_URL + '/deploy-html-simulation?' + query;

  var done = grunt.task.current.async();

  request( url, function( error, response, body ) {
    if ( !error && response.statusCode === 200 ) {
      grunt.log.writeln( 'sending request to: ' + url );
    }
    else {
      grunt.log.writeln( 'error: deploy failed' );
    }
    done();
  } );
};
