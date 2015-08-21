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
var assert = require( 'assert' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

// constants
var PACKAGE_JSON = 'package.json';
var DEPENDENCIES_JSON = 'build/dependencies.json';
var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
var DEFAULT_PRODUCTION_SERVER_NAME = 'figaro.colorado.edu';
var DEFAULT_PRODUCTION_SERVER_URL = 'https://phet.colorado.edu';

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  // read package.json (required)
  var packageJSON = grunt.file.readJSON( PACKAGE_JSON );
  assert( packageJSON.name, 'missing name from ' + PACKAGE_JSON );
  assert( packageJSON.version, 'missing name from ' + PACKAGE_JSON );

  // read dependencies.json (required)
  var dependencies = grunt.file.readJSON( DEPENDENCIES_JSON );

  // read build-locale.json (required)
  var preferences = grunt.file.readJSON( PREFERENCES_FILE );
  assert( preferences.buildServerAuthorizationCode, 'buildServerAuthorizationCode is missing from ' + PREFERENCES_FILE );

  var query = querystring.stringify( {
    'repos': JSON.stringify( dependencies ),
    'locales': JSON.stringify( [ ChipperConstants.FALLBACK_LOCALE ] ),
    'simName': packageJSON.name,
    'version': packageJSON.version,
    'serverName': preferences.productionServerName || DEFAULT_PRODUCTION_SERVER_NAME,
    'authorizationCode': preferences.buildServerAuthorizationCode
  } );

  var productionServerURL = preferences.productionServerURL || DEFAULT_PRODUCTION_SERVER_URL;
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
