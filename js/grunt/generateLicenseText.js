// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates the license text that goes in the header of a sim's HTML file.
 * It shares the license text with other grunt tasks via global.phet.licenseText.
 * License info is read from sherpa/info.js.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

var assert = require( 'assert' );
var info = require( '../../../sherpa/info' ); // license info for all 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  // Read sherpa/info.js, which contains the license info.
  var licenseInfo = info();

  // Collect the set of license keys.
  console.log( 'Adding common licenses...' );
  var licenseKeys = [
    // dependencies common to all sims that are NOT preloaded
    'almond-0.2.9',
    'font-awesome',
    'pegjs',
    'require-i18n',
    'text-2.0.12'
  ];

  //TODO the conventions for key names in info.js are dubious
  // Extract keys from pkg.preload, for any dependencies in sherpa
  console.log( 'Adding preload licenses...' );
  pkg.preload.forEach( function( path ) {
    if ( path.indexOf( '/sherpa/' ) !== -1 ) {
      path = path.replace( /\.js$/, '' );  // trim .js file suffix
      var lastSlash = path.lastIndexOf( '/' );
      var key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

  // Add sim-specific licenses, as specified in the (optional) licenseKeys field of package.json.
  if ( pkg.licenseKeys ) {
    console.log( 'Adding sim-specific licenses...' );
    licenseKeys = licenseKeys.concat( pkg.licenseKeys );
  }

  // Finally, add additional licenses required by together (data collection).
  if ( grunt.option( 'together' ) ) {
    console.log( 'Adding together licenses...' );
    licenseKeys.push( 'jsondiffpatch-0.1.31' );
  }

  // Sort keys and remove duplicates
  licenseKeys = _.uniq( _.sortBy( licenseKeys, function( key ) { return key.toUpperCase(); } ) );

  grunt.log.writeln( 'licenseKeys = ' + licenseKeys.toString() );

  // Separator between each license
  var separator = '=';

  // Combine all licenses into 1 string
  var licenseText = separator + '\n';
  licenseKeys.forEach( function( key ) {
    var license = licenseInfo[key];
    assert( license, 'no entry in sherpa/info.js for key = ' + key );
    licenseText += license.text + '\n';
    if ( license.selectedLicense ) {
      // Where PhET has selected from among a choice of licenses
      licenseText += ( 'Selected license: ' + license.selectedLicense + '\n' );
    }
    licenseText += ( separator + '\n' );
  } );

  //grunt.log.writeln( 'licenseText=' + licenseText ); // debugging output

  // share with other tasks via a global
  global.phet = global.phet || {};
  global.phet.licenseText = licenseText;
};
