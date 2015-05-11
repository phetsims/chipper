// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates the license text that goes in the header of a sim's HTML file.
 * It shares the license text with other grunt tasks via global.phet.licenseText.
 *
 * License info is read from sherpa/info.json. The fields in each license entry are:
 *
 * {string[]} text - the text of the license info. A newline will be appended to each array element
 * {string} [selectedLicense] - indicates which license PhET has selected to use for a library available under multiple licenses
 * {string[]} [usage] - how the library is used by PhET. Values include "sim", "development", "docs".
 * {string} [notes] - optional notes
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

var assert = require( 'assert' );
/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  // Read sherpa/info.json, which contains the license info.
  var licenseInfo = grunt.file.readJSON( '../sherpa/info.json' );

  // Collect the set of license keys.
  console.log( 'Adding common licenses...' );
  var licenseKeys = [
    // dependencies common to all sims that are NOT preloaded
    'almond-0.2.9',
    'font-awesome',
    'pegjs-0.7.0',
    'require-i18n',
    'text-2.0.12'
  ];

  //TODO the conventions for key names in info.json are dubious
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
  var SEPARATOR = '=';

  // Combine all licenses into 1 string
  var licenseText = SEPARATOR + '\n';
  licenseKeys.forEach( function( key ) {

    var license = licenseInfo[key];
    assert( license, 'no entry in sherpa/info.json for key = ' + key );

    // text is an array of strings.  Each string goes on a new line.
    for ( var i = 0; i < license.text.length; i++ ) {
      licenseText += ( license.text[i] + '\n' );
    }

    // selectedLicense is optional. When there are multiple licenses, PhET selects one.
    if ( license.selectedLicense ) {
      licenseText += ( 'Selected license: ' + license.selectedLicense + '\n' );
    }
    licenseText += ( SEPARATOR + '\n' );
  } );
  licenseText.trim();

  //grunt.log.writeln( 'licenseText=<' + licenseText + '>' ); // debugging output

  // share with other tasks via a global
  global.phet = global.phet || {};
  global.phet.licenseText = licenseText;
};
