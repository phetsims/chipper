// Copyright 2002-2015, University of Colorado Boulder

// The following comment permits node-specific globals (such as process) to pass jshint
/* jslint node: true */
'use strict';

var assert = require( 'assert' );

/**
 * Gets configuration information that is related to deploying sims.
 *
 * All fields are @public (read-only).
 * Fields include:
 *
 * {string} name - name of the repository being built
 * {string} version - version identifier
 * {string} simTitleStringKey - key of the sim's title string
 * {string} buildServerAuthorizationCode
 * {string} devUsername
 * {string} devDeployServer
 * {string} devDeployPath
 * {string} productionServerName
 * {string} productionServerURL
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function() {

  /**
   * @param fs - the node fs API
   * @returns {Object} deploy configuration information, fields documented above
   *
   * @private
   */
  function getDeployConfig( fs ) {

    //------------------------------------------------------------------------------------
    // read configuration files

    // ./package.json (required)
    var PACKAGE_FILENAME = 'package.json';
    var packageJSON = JSON.parse( fs.readFileSync( PACKAGE_FILENAME, { encoding: 'utf-8' } ) );
    assert( packageJSON.name, 'name missing from ' + PACKAGE_FILENAME );
    assert( packageJSON.version, 'version missing from ' + PACKAGE_FILENAME );

    // $HOME/.phet/build-local.json (required)
    var BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
    var buildLocalJSON = JSON.parse( fs.readFileSync( BUILD_LOCAL_FILENAME, { encoding: 'utf-8' } ) );
    assert( buildLocalJSON.buildServerAuthorizationCode, 'buildServerAuthorizationCode missing from ' + buildLocalJSON );
    assert( buildLocalJSON.devUsername, 'devUsername missing from ' + BUILD_LOCAL_FILENAME );

    //------------------------------------------------------------------------------------
    // Assemble the deployConfig

    var deployConfig = {
      // These fields have no dependencies on other entries in deployConfig.
      name: packageJSON.name,
      version: packageJSON.version,
      buildServerAuthorizationCode: buildLocalJSON.buildServerAuthorizationCode,
      devUsername: buildLocalJSON.devUsername,
      devDeployServer: buildLocalJSON.devDeployServer || 'spot.colorado.edu',
      devDeployPath: buildLocalJSON.devDeployPath || '/htdocs/physics/phet/dev/html/',
      productionServerName: buildLocalJSON.productionServerName || 'figaro.colorado.edu',
      productionServerURL: buildLocalJSON.productionServerURL || 'https://phet.colorado.edu'
    };

    // These fields depend on other entries in buildConfig.
    //TODO simTitleStringKey default is duplicated from getBuildConfig.js
    deployConfig.simTitleStringKey = packageJSON.phet.simTitleStringKey ||
                                     ( deployConfig.requirejsNamespace + '/' + deployConfig.name + '.name' );

    return deployConfig;
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return getDeployConfig;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = getDeployConfig;
  }
})();