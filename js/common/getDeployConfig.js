// Copyright 2015, University of Colorado Boulder

var assert = require( 'assert' );

/**
 * Gets configuration information that is related to deploying sims.
 *
 * All fields are @public (read-only).
 * Fields include:
 *
 * Required in package.json:
 * {string} name - name of the repository being built
 * {string} version - version identifier
 * {string} phet.requirejsNamespace - the requirejs namespace
 *
 * Required in build-local.json:
 * {string} buildServerAuthorizationCode - password that verifies if build request comes from phet team members
 * {string} devUsername - username on our dev server
 *
 * Optional in build-local.json:
 * {string} devDeployServer - name of the dev server, defaults to 'spot.colorado.edu'
 * {string} devDeployPath - path on dev server to deploy to, defaults to '/htdocs/physics/phet/dev/html/'
 * {string} productionServerURL - production server url, defaults to 'https://phet.colorado.edu', can be over-ridden to 'https://phet-dev.colorado.edu'
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function() {
  'use strict';

  var getVersionForBrand = require( '../../../chipper/js/grunt/getVersionForBrand' );
  var getBrand = require( '../../../chipper/js/grunt/getBrand' );

  /**
   * @param {Object} grunt
   * @param fs - the node fs API
   * @returns {Object} deploy configuration information, fields documented above
   *
   * @private
   */
  function getDeployConfig( grunt, fs ) {

    //------------------------------------------------------------------------------------
    // read configuration files

    // ./package.json (required)
    var PACKAGE_FILENAME = 'package.json';
    var packageJSON = JSON.parse( fs.readFileSync( PACKAGE_FILENAME, { encoding: 'utf-8' } ) );
    assert( packageJSON.name, 'name missing from ' + PACKAGE_FILENAME );
    assert( packageJSON.version, 'version missing from ' + PACKAGE_FILENAME );
    assert( packageJSON.phet.requirejsNamespace, 'phet.requirejsNamespace missing from ' + PACKAGE_FILENAME );

    // $HOME/.phet/build-local.json (required)
    var BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
    var buildLocalJSON = JSON.parse( fs.readFileSync( BUILD_LOCAL_FILENAME, { encoding: 'utf-8' } ) );
    assert( buildLocalJSON.buildServerAuthorizationCode, 'buildServerAuthorizationCode missing from ' + BUILD_LOCAL_FILENAME );
    assert( buildLocalJSON.devUsername, 'devUsername missing from ' + BUILD_LOCAL_FILENAME );

    //------------------------------------------------------------------------------------
    // Assemble the deployConfig

    var brand = getBrand( grunt, buildLocalJSON );

    var deployConfig = {
      // These fields have no dependencies on other entries in deployConfig.
      name: packageJSON.name,
      version: getVersionForBrand( brand, packageJSON.version ),
      requirejsNamespace: packageJSON.phet.requirejsNamespace,
      buildServerAuthorizationCode: buildLocalJSON.buildServerAuthorizationCode,
      buildServerNotifyEmail: buildLocalJSON.buildServerNotifyEmail || null,
      devUsername: buildLocalJSON.devUsername,
      devDeployServer: buildLocalJSON.devDeployServer || 'spot.colorado.edu',
      devDeployPath: buildLocalJSON.devDeployPath || '/htdocs/physics/phet/dev/html/',
      productionServerURL: buildLocalJSON.productionServerURL || 'https://phet.colorado.edu'
    };

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