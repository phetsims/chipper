// Copyright 2002-2015, University of Colorado Boulder

/**
 * This file is used when loading media files (images, audio,...) via plugins, to accomplish 2 goals:
 *
 *
 * (a) determine that PhET Simulations are built using compatible resources.  Each media file must
 * be annotated in a license.json file in the same directory.  Media files without a compatible license will cause
 * the build to fail.
 *
 * (b) provide information from the 3rd-party media files to the build system, so that a report can be included in the
 * build HTML file
 *
 * Each media file must have an entry in a license.json file in the same directory which indicates the
 * origin of the file as well as its licensing.  The license.json file should contain one entry per media file,
 * and each should be annotated with the following:
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
(function() {
  'use strict';

  /**
   * Returns a string indicating a problem with licensing for a media file, or null if there is no problem found.
   * The license.json file is consulted.  This function has no side effects (compare to getLicenseEntry above)
   *
   * @param {string} absolutePath - the path for the media file
   * @returns {object} the entry from the license.json file
   *                     or null if the license.json file is missing
   *                     or null if the license.json file exists but has no entry for the given file
   *
   * @private
   */
  function getLicenseEntry( absolutePath ) {

    var lastSlashIndex = absolutePath.lastIndexOf( '/' );
    var prefix = absolutePath.substring( 0, lastSlashIndex );
    var licenseFilename = prefix + '/license.json';
    var mediaFilename = absolutePath.substring( lastSlashIndex + 1 );

    var file = null;
    // look in the license.json file to see if there is an entry for that file
    try {
      file = global.fs.readFileSync( licenseFilename, 'utf8' );
    }
    catch( err ) {
      // File not found
      return null;
    }
    var json = JSON.parse( file );

    var entry = json[ mediaFilename ];
    if ( !entry ) {
      // Not annotated in file
      return null;
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