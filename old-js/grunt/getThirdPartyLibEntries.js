// Copyright 2015, University of Colorado Boulder

/**
 * This function returns an object literal that describes the third-party libraries that are included in the html deliverable.
 * License info is read from sherpa/lib/license.json, and the format of the object literal is similar to that syntax.
 *
 * See getLicenseEntry.js for a description & syntax of the license entries
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var _ = require( '../../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match
var assert = require( 'assert' );

var THIRD_PARTY_LICENSES_FILENAME = '../sherpa/lib/license.json'; // contains third-party license info
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {

  // Read license info
  var licenseInfo = grunt.file.readJSON( THIRD_PARTY_LICENSES_FILENAME );

  var licenseKeys = buildConfig.licenseKeys.slice( 0 ); // make a copy, we'll be adding keys

  // Add all dependencies. Duplicates will be removed later.
  for ( var i = 0; i < licenseKeys.length; i++ ) {
    var license = licenseInfo[ licenseKeys[ i ] ];
    assert( license, THIRD_PARTY_LICENSES_FILENAME + ': no entry for key = ' + licenseKeys[ i ] );
    var dependencies = license.dependencies;
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

    // verify required keys
    assert( license, THIRD_PARTY_LICENSES_FILENAME + ': no entry for key = ' + key );
    assert( license.text, THIRD_PARTY_LICENSES_FILENAME + ': no text field for key = ' + key );
    assert( license.license, THIRD_PARTY_LICENSES_FILENAME + ': no license field for key = ' + key );
    assert( license.projectURL, THIRD_PARTY_LICENSES_FILENAME + ': no projectURL field for key = ' + key );
    assert( license.notes, THIRD_PARTY_LICENSES_FILENAME + ': no notes field for key = ' + key );

    // read the license file
    var licenseText = grunt.file.read( LICENSES_DIRECTORY + key + '.txt', 'utf-8' );
    license.licenseText = licenseText.split( /\r?\n/ );

    libEntries[ key ] = license;
  } );

  return libEntries;
};
