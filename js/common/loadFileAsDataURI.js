// Copyright 2013-2015, University of Colorado Boulder

/**
 * Converts a resource (like an image or audio file) to base64.
 */
(function() {
  'use strict';

  function loadFileAsDataURI( filename ) {
    var mimeType = {
      'png': 'image/png',
      'svg': 'image/svg+xml',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'cur': 'image/x-icon', // cursor files (used in build-a-molecule). x-win-bitmap gives off warnings in Chrome
      'mp3': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'oga': 'audio/ogg',
      'bma': 'audio/webm', // webma is the full extension
      'wav': 'audio/wav'
    }[ filename.slice( -3 ) ];

    if ( !mimeType ) {
      throw new Error( 'Unknown mime type for filename: ' + filename );
    }

    var base64 = 'data:' + mimeType + ';base64,' + new Buffer( global.phet.chipper.fs.readFileSync( filename ) ).toString( 'base64' );
    return base64;
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return loadFileAsDataURI;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = loadFileAsDataURI;
  }
})();
