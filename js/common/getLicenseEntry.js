// Copyright 2015, University of Colorado Boulder

/**
 * Retrieves the license entry for a media file from license.json.
 * This file is used when loading media files (images, sounds,...) via media plugins.
 *
 * A license entry for a media file is found in a license.json file that is in
 * the same directory as the media file. A license entry has the following fields:
 *
 * text - copyright statement or "Public Domain"
 * projectURL - the URL for the resource
 * license - the name of license, such as "Public Domain"
 * notes - additional helpful information about the resource, or ""
 * exception - [optional] description of why the file is being used despite the fact that it doesn't match PhET's licensing policy
 *
 * For an example, see any of the license.json files in a PhET simulation's images directory.
 *
 * @author Sam Reid
 */

/* eslint-env browser, node */
'use strict';

(function() {

  /**
   * Retrieves the license entry for a media file from license.json.
   *
   * @param {string} absolutePath - the path for the media file
   * @returns {Object|null} the entry from the license.json file, null if there is no entry
   *
   * @private
   */
  function getLicenseEntry( absolutePath ) {

    var lastSlashIndex = absolutePath.lastIndexOf( '/' );
    var prefix = absolutePath.substring( 0, lastSlashIndex );
    var licenseFilename = prefix + '/license.json'; // license.json is a sibling of the media file
    var mediaFilename = absolutePath.substring( lastSlashIndex + 1 ); // field name in license.json

    // read license.json if it exists
    if ( !global.phet.chipper.fs.existsSync( licenseFilename ) ) {
      return null;
    }
    var fileContents = global.phet.chipper.fs.readFileSync( licenseFilename, 'utf8' );
    var json = null;
    try {
      json = JSON.parse( fileContents );
    }
    catch( err ) {
      if ( err instanceof SyntaxError ) {
        // default message is incomprehensible, see chipper#449
        throw new Error( 'syntax error in ' + licenseFilename + ': ' + err.message );
      }
      else {
        throw err;
      }
    }

    // get the media file's license entry
    var entry = json[ mediaFilename ];
    if ( !entry ) {
      return null; // Not annotated in file
    }
    return entry;
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return getLicenseEntry;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = getLicenseEntry;
  }
})();