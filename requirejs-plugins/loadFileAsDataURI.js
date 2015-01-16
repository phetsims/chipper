// Copyright 2002-2013, University of Colorado Boulder

//This function was taken from chipper/grunt/Gruntfile.js.  It is for converting a resource (like an image or audio file) to base64
define( function() {

  return function( filename ) {
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

    //TODO: use asserts at build time
    if ( !mimeType ) {
      throw new Error( 'Unknown mime type for filename: ' + filename );
    }

    var base64 = 'data:' + mimeType + ';base64,' + Buffer( fs.readFileSync( filename ) ).toString( 'base64' );
    return base64;
  };
} );