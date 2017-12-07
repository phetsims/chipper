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
const assert = require( 'assert' );
const grunt = require( 'grunt' );
const Jimp = require( 'jimp' ); // eslint-disable-line require-statement-match

/**
 * @param {string} repo - name of the repository
 * @param {number} width of the resized image
 * @param {number} height of the resized image
 * @returns {Promise}
 */
module.exports = function( repo, width, height ) {
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;
    const buildDirectory = `../${repo}/build`;
    const destinationFile = buildDirectory + `/${repo}-${width}.png`;

    if ( !grunt.file.exists( fullResImageName ) ) {
      grunt.log.writeln( `no image file exists: ${fullResImageName}. Not running task: generate-thumbnails` );
      return;
    }

    if ( !grunt.file.exists( buildDirectory ) ) {
      grunt.file.mkdir( buildDirectory );
    }
    assert( grunt.file.isDir( buildDirectory ), 'Error: "build" is not a directory' );

    new Jimp( fullResImageName, function() { //eslint-disable-line no-new
      this.resize( width, height ).write( destinationFile, function() {
        resolve();
      } );
    } );
  } );
};
