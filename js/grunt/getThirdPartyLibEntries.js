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
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' );

var THIRD_PARTY_LICENSES_FILENAME = '../sherpa/lib/license.json'; // contains third-party license info
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Read license info
  var licenseInfo = grunt.file.readJSON( THIRD_PARTY_LICENSES_FILENAME );

  var licenseKeys = buildConfig.licenseKeys.slice( 0 ); // make a copy, we'll be adding keys

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

    // verify required keys
    assert( license, 'sherpa/lib/license.json: no entry for key = ' + key );
    assert( license.text, 'sherpa/lib/license.json: no text field for key = ' + key );
    assert( license.license, 'sherpa/lib/license.json: no license field for key = ' + key );
    assert( license.projectURL, 'sherpa/lib/license.json: no projectURL field for key = ' + key );
    assert( license.notes, 'sherpa/lib/license.json: no notes field for key = ' + key );

    // read the license file
    var licenseText = grunt.file.read( LICENSES_DIRECTORY + key + '.txt', 'utf-8' );
    license.licenseText = licenseText.split( /\r?\n/ );

    libEntries[ key ] = license;
  } );

  return libEntries;
};
