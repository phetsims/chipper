// Copyright 2015, University of Colorado Boulder

/**
 * This grunt task generates 128x84 and 600x394 thumbnails of the sim's screenshot in assets.
 * Thumbnails are put in the build directory of the sim. If the directory doesn't exist, it is created.
 * New grunt tasks can easily be created to generate different sized images by passing this function
 * different heights and widths.
 *
 * @author Aaron Davis
 */
/* eslint-env node */
'use strict';

// modules
const grunt = require( 'grunt' );
const Jimp = require( 'jimp' ); // eslint-disable-line require-statement-match

/**
 * @param {string} repo - name of the repository
 * @param {number} width of the resized image
 * @param {number} height of the resized image
 * @returns {Promise} - Resolves to a {Buffer} with the image data
 */
module.exports = function( repo, width, height ) {
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;

    if ( !grunt.file.exists( fullResImageName ) ) {
      grunt.log.writeln( `no image file exists: ${fullResImageName}. Aborting generateThumbnails` );
      return;
    }

    new Jimp( fullResImageName, function() { //eslint-disable-line no-new
      this.resize( width, height ).getBuffer( Jimp.MIME_PNG, function( error, pngBuffer ) {
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
