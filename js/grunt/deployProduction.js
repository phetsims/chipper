// Copyright 2015, University of Colorado Boulder

/**
 * Deploy a simulation by sending a request to our build-server.
 *
 * @author Aaron Davis
 */
/* eslint-env node */
'use strict';

// modules
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );
var querystring = require( 'querystring' );
var request = require( 'request' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig
 * @param {function} callback - optional callback to run when finished, defaults to grunt.task.current.async()
 */
module.exports = function( grunt, buildConfig, callback ) {


  // Get the branch name to cross check brand/branch name for PhET-iO
  deployUtil.exec( grunt, 'git rev-parse --abbrev-ref HEAD', function( err, stdout ) {
    if ( err ) {
      grunt.fail.warn( 'Error getting branch name: ', err );
    }

    var isPhetioBranch = stdout.indexOf( '-phetio' ) >= 0;
    var isPhetioBrand = buildConfig.brand === 'phet-io';

    // If XOR on the two phetio settings, then throw an error.
    // We only want phet deploys from non phetio branches (i.e. 1.3 instead of 1.3-phetio).
    // We only want phet-io deploys from phetio branches.
    // See see https://github.com/phetsims/chipper/issues/582
    if ( isPhetioBranch ^ isPhetioBrand ) {
      grunt.fail.warn( 'Either in phet-io brand, or on a phet-io branch, but not both.' );
    }

    // configuration info from external files
    var deployConfig = getDeployConfig( grunt, global.phet.chipper.fs );

    // read dependencies.json (required)
    var dependenciesJSON = grunt.file.readJSON( 'build/dependencies.json' );

    var params = {
      repos: JSON.stringify( dependenciesJSON ),
      locales: grunt.option( 'locales' ) || '*',
      simName: deployConfig.name,
      version: deployConfig.version,
      authorizationCode: deployConfig.buildServerAuthorizationCode
    };

    if ( grunt.option( 'option' ) === 'rc' ) {
      params.option = 'rc';
    }

    if ( grunt.option( 'email' ) ) {
      params.email = grunt.option( 'email' );
    }
    else if ( deployConfig.buildServerNotifyEmail ) {
      params.email = deployConfig.buildServerNotifyEmail;
    }

    var query = querystring.stringify( params );

    var productionServerURL = deployConfig.productionServerURL;
    var url = productionServerURL + '/deploy-html-simulation?' + query;

    var done = callback || grunt.task.current.async();

    if ( grunt.option( 'dryRun' ) ) {
      grunt.log.writeln( 'Option \'dryRun\' set, URL will not be sent to build server.' );
      grunt.log.writeln( 'URL = ' + url );
      done();
    }
    else {

      // send the build request to the build server
      request( url, function( error, response, body ) {
        if ( error ) {
          grunt.fail.warn( 'Build request failed with error ' + error + '.' );
        }
        else if ( response.statusCode !== 200 ) {
          grunt.fail.warn( 'Build request failed with status code ' + response.statusCode + '.' );
        }
        else {
          grunt.log.writeln( 'Build request sent successfully, URL: ' + url );
        }
        done();
      } );
    }
  } );

};
