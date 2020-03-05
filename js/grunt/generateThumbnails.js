// Copyright 2017-2019, University of Colorado Boulder

/**
 * This grunt task generates 128x84 and 600x394 thumbnails of the sim's screenshot in assets.
 * Thumbnails are put in the build directory of the sim. If the directory doesn't exist, it is created.
 * New grunt tasks can easily be created to generate different sized images by passing this function
 * different heights and widths.
 *
 * @author Aaron Davis
 */

'use strict';

// modules
const grunt = require( 'grunt' );
const jimp = require( 'jimp' );

/**
 * @param {string} repo - name of the repository
 * @param {number} width of the resized image
 * @param {number} height of the resized image
 * @param {number} quality - percent quality, in the range [0..100]
 * @param {string} mime - Mime type - one of jimp.MIME_PNG, jimp.MIME_JPEG, jimp.MIME_BMP
 * @returns {Promise} - Resolves to a {Buffer} with the image data
 */
module.exports = function ( repo, width, height, quality, mime ) {
  console.log( 'generating thumbnail for ', repo, width, height, quality, mime );
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;

    console.log( 'generating thumbnail for ', fullResImageName );
    try {
      if ( !grunt.file.exists( fullResImageName ) ) {
        console.log( `no image file exists: ${fullResImageName}. Aborting generateThumbnails` );
        return;
      }
    }
    catch ( e ) {
      console.error( 'check for file existence failed', e );
    }
    console.log( 'file exists! ', fullResImageName );

    try {
      new jimp( fullResImageName, function() { //eslint-disable-line no-new
        console.log( 'jimping', repo, width, height, quality, mime );
        if ( mime === jimp.MIME_JPEG ) {
          this.quality( quality );
        }
        this.resize( width, height ).getBuffer( mime, function ( error, buffer ) {
          if ( error ) {
            console.log( 'jimp fail :(' );
            reject( new Error( error ) );
          }
          else {
            console.log( 'jimp success!' );
            resolve( buffer );
          }
        } );
      } );
    }
    catch ( e ) {
      console.error( 'new jimp failed', e );
      reject( e );
    }
    console.log( 'jimp finished', repo, width, height, quality, mime );
  } );
};
