// Copyright 2002-2015, University of Colorado Boulder

/**
 * Determines whether a license entry is "acceptable".
 *
 * For PhET brands, a license entry is acceptable if it is compatible with PhET licensing policies,
 * or if it has an "exception" annotation explaining why PhET licensing policies can be ignored.
 *
 * For non-PhET brands, all license entries are assumed to be acceptable.
 *
 * @author Sam Reid
 * @author Chris Malley (PixelZoom, Inc.)
 */

(function() {
  'use strict';

  /**
   * Determines whether a brand is subject to PhET licensing constraints.
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
   * Determines whether a license entry is acceptable. See doc above.
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

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return isAcceptableLicenseEntry;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = isAcceptableLicenseEntry;
  }
})();