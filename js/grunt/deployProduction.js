// Copyright 2002-2015, University of Colorado Boulder

/**
 * Deploy a simulation by sending a request to our build-server.
 *
 * @author Aaron Davis
 */

// modules
var querystring = require( 'querystring' );
var request = require( 'request' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );

/**
 * @param grunt - the grunt instance
 * @param callback - optional callback to run when finished, defaults to grunt.task.current.async()
 */
module.exports = function( grunt, callback ) {
  'use strict';
  
  // configuration info from external files
  var deployConfig = getDeployConfig( global.phet.chipper.fs );

  if ( grunt.option( 'locales' ) ) {
    throw new Error( 'Should not specify locales for production deployment' );
  }

  // read dependencies.json (required)
  var dependenciesJSON = grunt.file.readJSON( 'build/dependencies.json' );

  var params = {
    'repos': JSON.stringify( dependenciesJSON ),
    'simName': deployConfig.name,
    'version': deployConfig.version,
    'serverName': deployConfig.productionServerName,
    'authorizationCode': deployConfig.buildServerAuthorizationCode
  };

  if ( grunt.option( 'option' ) === 'rc' ) {
    params.option = 'rc';
  }

  var query = querystring.stringify( params );

  var productionServerURL = deployConfig.productionServerURL;
  var url = productionServerURL + '/deploy-html-simulation?' + query;

  var done = callback || grunt.task.current.async();

  request( url, function( error, response, body ) {
    if ( error ) {
      grunt.log.writeln( 'error: deploy failed with error ' + error );
    }
    else if ( response.statusCode !== 200 ) {
      grunt.log.writeln( 'error: deploy failed with status code ' + response.statusCode );
    }
    else {
      grunt.log.writeln( 'sending request to: ' + url );
    }
    done();
  } );
};
