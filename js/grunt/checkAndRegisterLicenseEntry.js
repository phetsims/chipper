//  Copyright 2002-2014, University of Colorado Boulder

/**
 * This function is called when a media file (images, audio, ...) is loaded by a media plugin. It:
 * (1) verifies that the file's license is compatible with PhET licensing policies
 * (2) registers the file's license entry with a global so that a report can be produced after the build
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var isAcceptableLicenseEntry = require( '../../../chipper/js/grunt/isAcceptableLicenseEntry' );

  /**
   * @param {string} name - the symbolic media filename as supplied to the plugin, e.g. JOHN_TRAVOLTAGE/arm.png
   * @param {*} licenseEntry - license entry for the media file, documented in getLicenseEntry.js
   * @param {string} brand
   * @param {string} mediaType - the type of media and name of the media subdirectory ('audio'|'image'|'mipmap'|...)
   * @param {function} onload - a function that conforms to the requirejs onload API
   */
  function checkAndRegisterLicenseEntry( name, licenseEntry, brand, mediaType, onload ) {
    if ( isAcceptableLicenseEntry( name, licenseEntry, brand ) ) {
      global.phet.chipper.licenseEntries[ mediaType ] = global.phet.chipper.licenseEntries[ mediaType ] || {};
      global.phet.chipper.licenseEntries[ mediaType ][ name ] = licenseEntry;
      onload( null );
    }
    else {
      onload.error( new Error( 'unacceptable license entry for ' + name ) );
    }
  }

  return checkAndRegisterLicenseEntry;
} );