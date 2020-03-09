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
const sharp = require( 'sharp' );

/**
 * @param {string} repo - name of the repository
 * @param {number} width of the resized image
 * @param {number} height of the resized image
 * @param {number} quality - percent quality, in the range [0..100]
 * @param {string} mime - Mime type - one of jimp.MIME_PNG, jimp.MIME_JPEG, jimp.MIME_BMP
 * @param {string} destination
 * @returns {Promise} - Resolves to a {Buffer} with the image data
 */
module.exports = async function ( repo, width, height, quality, mime, destination ) {
  const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;

  grunt.log.writeln( `Generating image for ${repo}, ${width}, ${height}, ${quality}, ${mime}` );
  try {
    if ( !grunt.file.exists( fullResImageName ) ) {
      return Promise.reject( 'file not found' );
    }
  }
  catch ( e ) {
    return Promise.reject( 'file existence check failed' );;
  }

  let image = sharp( fullResImageName )
    .resize( width, height );

  if ( mime === sharp.format.png.id ) {
    image = image.png();
  }
  else if ( mime === sharp.format.jpeg.id ) {
    image = image.jpeg( {
      quality: quality
    } );
  }

  return await image.toFile( destination );

};
