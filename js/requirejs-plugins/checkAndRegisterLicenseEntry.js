//  Copyright 2002-2014, University of Colorado Boulder

/**
 * When media files (images, audio) are loaded by the plugins, we also check to see that their license is compatible with
 * PhET licensing, and register each entry with a global so that a report can be produced after the build.  This
 * code was factored out in #229.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
'use strict';
(function() {

  var checkAndRegisterLicenseEntry = function( name, path, brand, mediaType, onload, getLicenseEntry, isAcceptableLicenseEntry ) {

    var licenseEntry = getLicenseEntry( path );
    if ( isAcceptableLicenseEntry( name, licenseEntry, brand ) ) {
      global.phet.chipper.licenseEntries[ mediaType ] = global.phet.chipper.licenseEntries[ mediaType ] || {};
      global.phet.chipper.licenseEntries[ mediaType ][ name ] = licenseEntry;
      onload( null );
    }
    else {
      onload.error( new Error( 'unacceptable license entry for ' + path ) );
    }
  };

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return checkAndRegisterLicenseEntry;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = checkAndRegisterLicenseEntry;
  }
})();