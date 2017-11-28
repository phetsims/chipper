// Copyright 2017, University of Colorado Boulder

/**
 * This grunt task generates the 800x400 letter-boxed version of the sim screenshot for use in twitter cards (metadata) on the website simulation
 * pages.
 *
 * @author Matt Pennington
 */
/* eslint-env node */
'use strict';

// modules
const assert = require( 'assert' );
const Jimp = require( 'jimp' ); // eslint-disable-line require-statement-match

/**
 * @param {Object} grunt - the grunt instance
 * @param {string} repo - name of the repository
 * @returns {Promise}
 */
module.exports = function( grunt, repo ) {
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot.png`;
    const buildDirectory = `../${repo}/build`;
    const destinationFile = buildDirectory + `/${repo}-twitter-card.png`;

    if ( !grunt.file.exists( fullResImageName ) ) {
      grunt.log.writeln( `no image file exists: ${fullResImageName}. Not running task: generate-thumbnails` );
      return;
    }

    if ( !grunt.file.exists( buildDirectory ) ) {
      grunt.file.mkdir( buildDirectory );
    }
    assert( grunt.file.isDir( buildDirectory ), 'Error: "build" is not a directory' );

    // The following creates an 800x400 image that is a letter-boxed version of the original size image and has small transparent padding on the top and bottom.
    new Jimp( fullResImageName, function() { // eslint-disable-line
      this.resize( 600, 394 ) // Preserve original dimensions
        .contain( 585, 400 )  // Resize to allow padding on top/bottom
        .contain( 800, 400 )  // Add padding on right/left
        .write( destinationFile, function() {
          resolve();
        } );
    } );
  } );
};
