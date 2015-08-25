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
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );

/**
 * @param grunt - the grunt instance
 * @param callback - optional callback to run when finished, defaults to grunt.task.current.async()
 */
module.exports = function( grunt, callback ) {

  var done = callback || grunt.task.current.async();

  // configuration info from external files
  var deployConfig = getDeployConfig( global.phet.chipper.fs );

  // read dependencies.json (required)
  var dependenciesJSON = grunt.file.readJSON( 'build/dependencies.json' );

  var query = querystring.stringify( {
    'repos': JSON.stringify( dependenciesJSON ),
    'locales': JSON.stringify( [ ChipperConstants.FALLBACK_LOCALE ] ),
    'simName': deployConfig.name,
    'version': deployConfig.version,
    'serverName': deployConfig.productionServerName,
    'authorizationCode': deployConfig.buildServerAuthorizationCode
  } );

  var productionServerURL = deployConfig.productionServerURL;
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
