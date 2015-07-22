// Copyright 2002-2015, University of Colorado Boulder

(function() {
  'use strict';

  /**
   * Returns a string indicating a problem with licensing for the image/audio file, or null if there is no problem found.
   * The license.txt file is consulted.
   *
   * @param {string} abspath - the path for the file
   * @returns {*}
   */
  function getLicensingIssuesForFile( abspath ) {

    // look in the license.txt file to see if there is an entry for that file
    try {
      var lastSlash = abspath.lastIndexOf( '/' );
      var prefix = abspath.substring( 0, lastSlash );
      var licenseFilename = prefix + '/license.txt';
      var assetFilename = abspath.substring( lastSlash + 1 );
      var file = global.fs.readFileSync( licenseFilename, 'utf8' );

      //find the line that annotates the asset
      var lines = file.split( /\r?\n/ );

      // Count how many entries found in case there are conflicting annotations
      var foundEntries = 0;
      for ( var i = 0; i < lines.length; i++ ) {
        var line = lines[ i ];
        if ( line.indexOf( assetFilename ) === 0 ) {
          foundEntries++;

          // Heuristics for whether PhET created the asset
          if (
            line.indexOf( 'source=PhET' ) < 0 &&
            line.indexOf( 'author=PhET' ) < 0 &&
            line.indexOf( 'author=phet' ) < 0 &&
            line.indexOf( 'author=Ron Le Master' ) < 0 &&
            line.indexOf( 'author=Emily Randall' ) < 0 &&
            line.indexOf( 'author=Yuen-ying Carpenter' ) < 0 &&
            line.indexOf( 'author=Bryce' ) < 0 &&
            line.toLowerCase().indexOf( 'public domain' ) < 0 &&
            line.indexOf( 'Creative Commons 0' ) < 0 &&
            line.indexOf( 'Snow Day' ) < 0
          ) {

            // Report that the item came from a 3rd party
            return ( '3RD PARTY: ' + abspath + ': ' + line );
          }
        }
      }
      if ( foundEntries === 0 ) {
        return ( 'NOT ANNOTATED IN FILE: ' + abspath );
      }
      else if ( foundEntries > 1 ) {
        return ( 'MULTIPLE ANNOTATIONS: ' + abspath );
      }
    }
    catch( err ) {
      return ( 'NOT ANNOTATED (NO FILE): ' + abspath );
    }
    return 'OK';
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return getLicensingIssuesForFile;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = getLicensingIssuesForFile;
  }
})();