// Copyright 2017, University of Colorado Boulder

/**
 * This grunt task generates the 800x400 letter-boxed version of the sim screenshot for use in
 * twitter cards (metadata) on the website simulation pages.
 *
 * @author Matt Pennington
 */

'use strict';

// modules
const grunt = require( 'grunt' );
const Jimp = require( 'jimp' ); // eslint-disable-line require-statement-match

/**
 * @param {string} repo - name of the repository
 * @returns {Promise.<Buffer>} - Resolves with a PNG {Buffer}
 */
module.exports = function( repo ) {
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;

    if ( !grunt.file.exists( fullResImageName ) ) {
      grunt.log.writeln( `no image file exists: ${fullResImageName}. Not running task: generate-thumbnails` );
      return;
    }

    // The following creates an 800x400 image that is a letter-boxed version of the original size image and
    // has transparent padding, potentially on all sides.
    new Jimp( fullResImageName, function() { // eslint-disable-line
      this.resize( 600, 394 ) // Preserve original dimensions
        .contain( 585, 400 )  // Resize to allow padding on top/bottom
        .contain( 800, 400 )  // Add padding on right/left
        .getBuffer( Jimp.MIME_PNG, function( error, pngBuffer ) {
          if ( error ) {
            reject( new Error( error ) );
          }
          else {
            resolve( pngBuffer );
          }
        } );
    } );
  } );
};
