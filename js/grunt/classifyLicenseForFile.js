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
   * @param {string} abspath - the path for the file
   * @returns {*}
   */
  function classifyLicenseForFile( name, abspath ) {

    var lines = null;
    var lastSlash = abspath.lastIndexOf( '/' );
    var prefix = abspath.substring( 0, lastSlash );
    var licenseFilename = prefix + '/license.txt';
    var assetFilename = abspath.substring( lastSlash + 1 );

    // look in the license.txt file to see if there is an entry for that file
    try {
      var file = global.fs.readFileSync( licenseFilename, 'utf8' );

      //find the line that annotates the asset
      lines = file.split( /\r?\n/ );
    }
    catch( err ) {
      return { classification: 'missing-license.txt', isProblematic: true };
    }

    // Count how many entries found in case there are conflicting annotations
    var entries = [];
    for ( var i = 0; i < lines.length; i++ ) {
      var line = lines[ i ];
      if ( line.indexOf( assetFilename ) === 0 ) {
        entries.push( line );
      }
    }
    if ( entries.length === 0 ) {
      return { classification: 'not-annotated', isProblematic: true };
    }
    else if ( entries.length > 1 ) {
      return { classification: 'multiple-annotations', isProblematic: true };
    }

    // Heuristics for whether PhET created the asset
    var entry = entries[ 0 ];
    if (
      entry.indexOf( 'source=PhET' ) >= 0 ||
      entry.indexOf( 'author=PhET' ) >= 0 ||
      entry.indexOf( 'author=phet' ) >= 0 ||
      entry.indexOf( 'author=Ron Le Master' ) >= 0 ||
      entry.indexOf( 'author=Emily Randall' ) >= 0 ||
      entry.indexOf( 'author=Yuen-ying Carpenter' ) >= 0 ||
      entry.indexOf( 'author=Bryce' ) >= 0 ||
      entry.indexOf( 'Creative Commons 0' ) >= 0 ||
      entry.indexOf( 'Snow Day' ) >= 0
    ) {

      // Report that the item came from a 3rd party
      return { classification: 'phet', isProblematic: false, entry: entry };
    }
    else if ( entry.toLowerCase().indexOf( 'public domain' ) >= 0 ) {

      // public domain OK, but should still be annotated
      return { classification: 'third-party', isProblematic: false, entry: entry };
    }
    else if ( entry.toLowerCase().indexOf( 'source=nasa' ) >= 0 ) {

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