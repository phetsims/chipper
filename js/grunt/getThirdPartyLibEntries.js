// Copyright 2002-2015, University of Colorado Boulder

/**
 * This function returns an object literal that describes the third-party libraries that are included in the html deliverable.
 * License info is read from sherpa/lib/license.json, and the format of the object literal is similar to that syntax.
 *
 * See getLicenseEntry.js for a description & syntax of the license entries
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
var assert = require( 'assert' );
var fs = require( 'fs' );
/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

var BUILD_INFO_FILENAME = '../chipper/build.json'; // contains build info, which identifies licenses applicable to all sims
var THIRD_PARTY_LICENSES_FILENAME = '../sherpa/lib/license.json'; // contains third-party license info
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  // Read build info
  assert( fs.existsSync( BUILD_INFO_FILENAME ), 'missing ' + BUILD_INFO_FILENAME );
  var buildInfo = grunt.file.readJSON( BUILD_INFO_FILENAME );

  // Read license info
  assert( fs.existsSync( THIRD_PARTY_LICENSES_FILENAME ), 'missing ' + THIRD_PARTY_LICENSES_FILENAME );
  var licenseInfo = grunt.file.readJSON( THIRD_PARTY_LICENSES_FILENAME );

  // Add common licenses, as specified in build.json
  grunt.log.debug( 'Adding common licenses...' );
  assert( buildInfo.common && buildInfo.common.licenseKeys, BUILD_INFO_FILENAME + ' is missing common.licenseKeys' );
  var licenseKeys = buildInfo.common.licenseKeys;

  // Extract keys from pkg.preload, for any dependencies in sherpa
  grunt.log.debug( 'Adding preload licenses...' );
  pkg.preload.forEach( function( path ) {
    if ( path.indexOf( '/sherpa/' ) !== -1 ) {
      var lastSlash = path.lastIndexOf( '/' );
      var key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

  // Add sim-specific licenses, as specified in the (optional) licenseKeys field of package.json.
  if ( pkg.licenseKeys ) {
    grunt.log.debug( 'Adding sim-specific licenses...' );
    licenseKeys = licenseKeys.concat( pkg.licenseKeys );
  }

  // Add together (data collection) licenses, as specified in build.json
  if ( global.phet.chipper.brand === 'phet-io' ) {
    grunt.log.debug( 'Adding together licenses...' );
    assert( buildInfo.together && buildInfo.together.licenseKeys, BUILD_INFO_FILENAME + ' is missing together.licenseKeys' );
    licenseKeys = licenseKeys.concat( buildInfo.together.licenseKeys );
  }

  // Add all dependencies. Duplicates will be removed later.
  for ( var i = 0; i < licenseKeys.length; i++ ) {
    var dependencies = licenseInfo[ licenseKeys[ i ] ].dependencies;
    if ( typeof dependencies === 'object' ) {
      licenseKeys = licenseKeys.concat( dependencies );
    }
  }

  // Sort keys and remove duplicates
  licenseKeys = _.uniq( _.sortBy( licenseKeys, function( key ) { return key.toUpperCase(); } ) );

  grunt.log.debug( 'licenseKeys = ' + licenseKeys.toString() );

  // Combine all licenses into 1 object literal
  var libEntries = {};
  licenseKeys.forEach( function( key ) {

    var license = licenseInfo[ key ];
    assert( license, 'sherpa/lib/license.json: no entry for key = ' + key );
    assert( license.text, 'sherpa/lib/license.json: no text field for key = ' + key );
    assert( license.license, 'sherpa/lib/license.json: no license field for key = ' + key );
    assert( license.projectURL, 'sherpa/lib/license.json: no projectURL field for key = ' + key );
    assert( license.notes, 'sherpa/lib/license.json: no notes field for key = ' + key );

    // Look up the license file
    var licenseFilename = LICENSES_DIRECTORY + key + '.txt';
    var licenseText;

    // Read the content of the license file into a string
    try {
      licenseText = fs.readFileSync( licenseFilename, 'utf-8' );
    }
    catch( error ) {

      // If the file could not be found or read, then error out.
      // This block is here for ease of debugging 
      grunt.log.error( 'error loading license file for ' + licenseFilename + ': ', error );

      // We don't want to proceed with errors in licensing, so rethrow the error
      throw error;
    }
    license.licenseText = licenseText.split( /\r?\n/ );

    libEntries[ key ] = license;
  } );

  return libEntries;
};
