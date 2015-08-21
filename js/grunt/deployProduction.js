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
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

// constants
var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'build/dependencies.json';
var DEFAULT_PRODUCTION_SERVER_NAME = 'figaro.colorado.edu';
var DEFAULT_PRODUCTION_SERVER_URL = 'https://phet.colorado.edu';

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  assert( fs.existsSync( PREFERENCES_FILE ), 'missing preferences file ' + PREFERENCES_FILE );
  var preferences = grunt.file.readJSON( PREFERENCES_FILE );
  assert( preferences.buildServerAuthorizationCode, 'buildServerAuthorizationCode is missing from ' + PREFERENCES_FILE );

  var productionServerName = preferences.productionServerName || DEFAULT_PRODUCTION_SERVER_NAME;
  var productionServerURL = preferences.productionServerURL || DEFAULT_PRODUCTION_SERVER_URL;

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
    'locales': JSON.stringify( [ ChipperConstants.FALLBACK_LOCALE ] ),
    'simName': sim,
    'version': version,
    'serverName': productionServerName,
    'authorizationCode': preferences.buildServerAuthorizationCode
  } );

  var url = productionServerURL + '/deploy-html-simulation?' + query;

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
