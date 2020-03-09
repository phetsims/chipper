// Copyright 2017-2019, University of Colorado Boulder

/**
 * This grunt task generates the 800x400 letter-boxed version of the sim screenshot for use in
 * twitter cards (metadata) on the website simulation pages.
 *
 * @author Matt Pennington
 */

'use strict';

// modules
const grunt = require( 'grunt' );
const sharp = require( 'sharp' );
/**
 * @param {string} repo - name of the repository
 * @param destination
 * @returns {Promise.<Buffer>} - Resolves with a PNG {Buffer}
 */
module.exports = async function ( repo, destination ) {
  const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;

  if ( !grunt.file.exists( fullResImageName ) ) {
    return Promise.reject( `no image file exists: ${fullResImageName}. Not running task: generate-thumbnails` );
  }

  // The following creates an 800x400 image that is a letter-boxed version of the original size image and
  // has transparent padding, potentially on all sides.
  return await sharp( fullResImageName )
    .resize( 600, 394 ) // Preserve original dimensions
    .resize( 585, 400, { fit: sharp.fit.contain } )  // Resize to allow padding on top/bottom
    .resize( 800, 400, { fit: sharp.fit.contain } )  // Add padding on right/left
    .toFile( destination );
};
