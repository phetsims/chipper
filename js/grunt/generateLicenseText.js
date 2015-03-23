// Copyright 2002-2015, University of Colorado Boulder

var assert = require( 'assert' );
var info = require( '../../../sherpa/info' ); // license info for all 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * Generates the license text that goes in the header of the sim's HTML file.
 * Shares the license text with other grunt tasks by attaching it to global.phet.licenseText.
 *
 * @param grunt
 * @param {string[]} preload field from package.json
 */
module.exports = function( grunt, preload ) {
  'use strict';

  /*
   * Prepare the license info. Run this first so that if something is missing from the license file
   * you will find out before having to wait for jshint/requirejs build
   */
  var licenseInfo = info();

  /*
   * Find all dependencies that have 'sherpa' in the path.
   * Please note, this requires all simulations to keep their dependencies in sherpa!
   */
  var sherpaDependencyPaths = _.filter( preload, function( dependency ) { return dependency.indexOf( 'sherpa' ) >= 0; } );

  /*
   * Add libraries that are not explicitly included by the sim.
   * Note: must have a . character for the parsing below TODO: Remove this restriction
   */
  sherpaDependencyPaths.push( 'almond-0.2.9.js' );
  sherpaDependencyPaths.push( 'pegjs.' );
  sherpaDependencyPaths.push( 'font-awesome.' );
  sherpaDependencyPaths.push( 'require-i18n.js' );
  sherpaDependencyPaths.push( 'text.js' );
  sherpaDependencyPaths.push( 'base64binary.js' );//TODO: Not all simulations use vibe

  // Sort by name of the library, have to match cases to sort properly
  var sortedSherpaDependencyPaths = _.sortBy( sherpaDependencyPaths, function( path ) {return path.toUpperCase();} );

  // Map the paths to instances from the info.js file
  var licenses = _.uniq( _.map( sortedSherpaDependencyPaths, function( sherpaDependencyPath ) {
    var lastSlash = sherpaDependencyPath.lastIndexOf( '/' );
    var lastDot = sherpaDependencyPath.lastIndexOf( '.' );
    var dependencyName = sherpaDependencyPath.substring( lastSlash + 1, lastDot );
    // console.log( 'found dependency: ' + sherpaDependencyPath + ', name = ' + dependencyName );

    // Make sure there is an entry in the info.js file, and return it
    assert( licenseInfo[ dependencyName ], 'no license entry for ' + dependencyName );
    return licenseInfo[ dependencyName ];
  } ) );

  // Get the text of each entry
  var separator = '=';

  // share with other tasks via a global
  global.phet = global.phet || {};
  global.phet.licenseText = _.reduce( licenses, function( memo, license ) {
    var selectedLicenseText = license.selectedLicense ? '> Selected license: ' + license.selectedLicense + '\n' : '';
    return memo + license.text + '\n' +
           selectedLicenseText +
           separator +
           '\n';
  }, separator + '\n' ).trim();

  grunt.log.writeln( 'created license info for ' + licenses.length + ' dependencies' );
};
