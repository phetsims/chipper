// Copyright 2015, University of Colorado Boulder

/**
 * Registers the license entry for a media file by adding it to global.phet.chipper.licenseEntries.
 * Also verifies that the file's license is "acceptable" (as defined in isAcceptableLicenseEntry below).
 * Intended to be called by media plugins at the time that media files are loaded.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function() {
  'use strict';

  /**
   * Determines whether a license entry is compatible with a brand's licensing policies.
   * @param {Object} entry - see getLicenseEntry.js
   * @param {string} brand - the string for the selected brand, such as 'phet'
   * @returns {boolean}
   */
  function isCompatibleLicenseEntry( entry, brand ) {
    if ( brand === 'phet' || brand === 'phet-io' ) {

      // PhET-specific brands have these licensing policies
      // Un-annotated entries are not acceptable
      return entry && ( entry.projectURL === 'http://phet.colorado.edu' ||
                        entry.license === 'Public Domain' ||
                        entry.license === 'NASA' );
    }
    else {

      // non-PhET brands have no licensing policies, so all entries are compatible
      return true;
    }
  }

  /**
   * Determines whether a license entry is "acceptable".  A license entry is acceptable if the entry is compatible with
   * the licensing polices for the specified brand, or if the entry has an "exception" field explaining why the
   * licensing policies can be ignored.
   *
   * @param {string} name - name of the resource whose license entry is being checked
   * @param {Object} entry - see getLicenseEntry.js
   * @param {string} brand - the string for the selected brand, such as 'phet'
   * @returns {boolean}
   */
  function isAcceptableLicenseEntry( name, entry, brand ) {
    var acceptable = isCompatibleLicenseEntry( entry, brand ) || (entry && !!entry.exception);
    if ( acceptable && entry && !!entry.exception ) {
      var warningMessage = 'license exception for ' + name + ': ' + entry.exception;

      // use grunt.log if it's available
      if ( global.phet.chipper.grunt ) {
        global.phet.chipper.grunt.log.warn( warningMessage );
      }
      else {
        console.log( 'WARNING: ' + warningMessage );
      }
    }
    return acceptable;
  }

  /**
   * Registers the license entry for a media file.
   * Intended to be called by media plugins.
   *
   * @param {string} name - the symbolic media filename as supplied to the plugin, e.g. JOHN_TRAVOLTAGE/arm.png
   * @param {Object} licenseEntry - license entry for the media file, documented in getLicenseEntry.js
   * @param {string} brand - the string for the selected brand, such as 'phet'
   * @param {string} mediaType - the type of media and name of the media subdirectory ('sound'|'image'|'mipmap'|...)
   * @param {function} onload - a function that conforms to the requirejs onload API
   */
  function registerLicenseEntry( name, licenseEntry, brand, mediaType, onload ) {
    if ( isAcceptableLicenseEntry( name, licenseEntry, brand ) ) {
      global.phet.chipper.licenseEntries = global.phet.chipper.licenseEntries || {}; // initialize if this is the first entry
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