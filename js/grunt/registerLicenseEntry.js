//  Copyright 2002-2014, University of Colorado Boulder

/**
 * Registers the license entry for a media file by adding it to global.phet.chipper.licenseEntries.
 *
 * Also verifies that the file's license is "acceptable" (see isAcceptableLicenseEntry for details).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function() {
  'use strict';

  /**
   * Determines whether a brand is subject to PhET licensing policies.
   * @param {string} brand
   * @returns {boolean}
   */
  function isApplicableBrand( brand ) {
    return brand === 'phet' || brand === 'phet-io';
  }

  /**
   * Determines whether a license entry is compatible with PhET licensing policies.
   * @param {*} entry see getLicenseEntry.js
   * @returns {boolean}
   */
  function isCompatibleLicenseEntry( entry ) {
    return entry.projectURL === 'http://phet.colorado.edu' ||
           entry.license === 'Public Domain' ||
           entry.license === 'NASA';
  }

  /**
   * Determines whether a license entry is "acceptable". For PhET brands, a license entry is acceptable
   * if it is compatible with PhET licensing policies, or if it has an "exception" field explaining why
   * PhET licensing policies can be ignored. For non-PhET brands, all license entries are acceptable.
   *
   * @param {string} name name of the resource whose license entry is being checked
   * @param {*} entry see getLicenseEntry.js
   * @param {string} brand
   * @returns {boolean}
   */
  function isAcceptableLicenseEntry( name, entry, brand ) {
    var acceptable = !isApplicableBrand( brand ) || isCompatibleLicenseEntry( entry ) || !!entry.exception;
    if ( acceptable && !!entry.exception ) {
      //TODO how to print warning without grunt.warn? see chipper#222
      console.log( 'WARNING: license exception for ' + name + ': ' + entry.exception );
    }
    return acceptable;
  }

  /**
   * Registers the license entry for a media file.
   *
   * @param {string} name - the symbolic media filename as supplied to the plugin, e.g. JOHN_TRAVOLTAGE/arm.png
   * @param {*} licenseEntry - license entry for the media file, documented in getLicenseEntry.js
   * @param {string} brand
   * @param {string} mediaType - the type of media and name of the media subdirectory ('audio'|'image'|'mipmap'|...)
   * @param {function} onload - a function that conforms to the requirejs onload API
   */
  function registerLicenseEntry( name, licenseEntry, brand, mediaType, onload ) {
    if ( isAcceptableLicenseEntry( name, licenseEntry, brand ) ) {
      global.phet.chipper.licenseEntries[ mediaType ] = global.phet.chipper.licenseEntries[ mediaType ] || {};
      global.phet.chipper.licenseEntries[ mediaType ][ name ] = licenseEntry;
      onload( null );
    }
    else {
      onload.error( new Error( 'unacceptable license entry for ' + name ) );
    }
  }

  return registerLicenseEntry;
} );