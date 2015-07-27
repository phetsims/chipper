// Copyright 2002-2015, University of Colorado Boulder

(function() {
  'use strict';

  if ( typeof global !== 'undefined' ) {
    global.imageAndAudioLicenseInfo = global.imageAndAudioLicenseInfo || {};
  }

  // Automatically write each classification to a global so it can be included in the HTML file after the build is 
  // complete
  var getLicenseInfo = function( _getLicenseInfo ) {
    return function( name, abspath ) {
      var licenseInfo = _getLicenseInfo( abspath );

      // Make it available for adding a list of 3rd party resources to the HTML
      // and for checking whether there are unused images/audio
      global.imageAndAudioLicenseInfo[ name ] = licenseInfo;

      // Return it for further processing
      return licenseInfo;
    };
  };

  /**
   * Returns a string indicating a problem with licensing for the image/audio file, or null if there is no problem found.
   * The license.json file is consulted.
   *
   * @param {string} abspath - the path for the file
   * @returns {*}
   *
   * @private
   */
  function _getLicenseInfo( abspath ) {
    var lastSlash = abspath.lastIndexOf( '/' );
    var prefix = abspath.substring( 0, lastSlash );
    var licenseFilename = prefix + '/license.json';
    var assetFilename = abspath.substring( lastSlash + 1 );

    var file = null;
    // look in the license.json file to see if there is an entry for that file
    try {
      file = global.fs.readFileSync( licenseFilename, 'utf8' );
    }
    catch( err ) {
      return { classification: 'missing-license.json', isProblematic: true, entry: null };
    }
    var json = JSON.parse( file );

    var entry = json[ assetFilename ];

    if ( !entry ) {
      return { classification: 'not-annotated', isProblematic: true, entry: entry };
    }
    else if ( entry.projectURL === 'http://phet.colorado.edu' ) {
      return { classification: 'phet', isProblematic: false, entry: entry };
    }
    else if ( entry.license === 'Public Domain' ) {
      // public domain OK, but should still be annotated
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else if ( entry.license === 'NASA' ) {
      // NASA OK, but should still be annotated
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else if ( entry.projectURL === 'http://www.americancinematheque.com/ball/1997MPBTravolta.htm' ) {
      // We decided to allow images for John Travoltage even though we were unable to contact American Cinematheque for 
      // explicit permission
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else if ( entry.notes === 'from Snow Day Math' ) {
      // Permit Snow Day Match images to pass the build--they should be replaced in the near future
      // by PhET-created artwork, see https://github.com/phetsims/making-tens/issues/25
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else {
      return { classification: 'third-party', isProblematic: true, entry: entry };
    }
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return getLicenseInfo( _getLicenseInfo );
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = getLicenseInfo( _getLicenseInfo );
  }
})();