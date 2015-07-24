// Copyright 2002-2015, University of Colorado Boulder

(function() {
  'use strict';

  if ( typeof global !== 'undefined' ) {
    global.thirdPartyImageAndAudioLicenseInfo = global.thirdPartyImageAndAudioLicenseInfo || [];
  }

  // Automatically write each classification to a global so it can be included in the HTML file after the build is 
  // complete
  var wrap = function( classifyLicenseForFile ) {
    return function( name, abspath ) {
      var licenseInfo = classifyLicenseForFile( name, abspath );
      if ( licenseInfo.classification === 'third-party' ) {

        // Add to global list of 3rd party images & audio. Include the name since it should be unique (otherwise 
        // different images with the same name would have collisions)
        global.thirdPartyImageAndAudioLicenseInfo.push( { name: name, licenseInfo: licenseInfo.entry } );
      }
      return licenseInfo;
    };
  };

  /**
   * Returns a string indicating a problem with licensing for the image/audio file, or null if there is no problem found.
   * The license.txt file is consulted.
   *
   * @param {string} name - the name of the resource, to help disambiguate different images with similar filenames.
   * @param {string} abspath - the path for the file
   * @returns {*}
   */
  function classifyLicenseForFile( name, abspath ) {

    var lastSlash = abspath.lastIndexOf( '/' );
    var prefix = abspath.substring( 0, lastSlash );
    var licenseFilename = prefix + '/license.json';
    var assetFilename = abspath.substring( lastSlash + 1 );

    var file = null;
    // look in the license.txt file to see if there is an entry for that file
    try {
      file = global.fs.readFileSync( licenseFilename, 'utf8' );
    }
    catch( err ) {
      return { classification: 'missing-license.json', isProblematic: true };
    }
    var json = JSON.parse( file );

    var entry = json[ assetFilename ];

    if ( !entry ) {
      return { classification: 'not-annotated', isProblematic: true };
    }
    else if ( entry.projectURL === 'http://phet.colorado.edu' ) {
      return { classification: 'phet', isProblematic: false, entry: entry };
    }
    else if ( entry.license.toLowerCase() === 'Public Domain' ) {
      // public domain OK, but should still be annotated
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else if ( entry.license === 'NASA' ) {
      // NASA OK, but should still be annotated
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else {
      return { classification: 'third-party', isProblematic: true, entry: entry };
    }
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return wrap( classifyLicenseForFile );
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = wrap( classifyLicenseForFile );
  }
})();