// Copyright 2002-2015, University of Colorado Boulder

/**
 * The following rules determine whether a license entry is compatible with PhET licensing.  When building with the 
 * 'phet' brand, an incompatible license will cause the build to fail.
 * 
 * @author Sam Reid
 */

(function() {
  'use strict';

  var LicenseEntryClassifier = {
    isAcceptable: function( entry ) {
      return entry !== null && (
          entry.projectURL === 'http://phet.colorado.edu' ||
          entry.license === 'Public Domain' ||
          entry.license === 'NASA' ||

          // The file was an unknown or incompatible 3rd party license.  Mark as problematic unless it has an exception
          // see https://github.com/phetsims/john-travoltage/issues/82
          entry.exception !== null
        );
    },
    isProblematic: function( entry ) {
      return !this.isAcceptable( entry );
    }
  };

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return LicenseEntryClassifier;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = LicenseEntryClassifier;
  }
})();