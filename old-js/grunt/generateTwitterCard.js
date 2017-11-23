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
var assert = require( 'assert' );
var Jimp = require( 'jimp' ); // eslint-disable-line require-statement-match

// constants
var BUILD_DIRECTORY = 'build';

/**
 * @param grunt - the grunt instance
 * @param {string} repositoryName - name of the repository
 * @param {function} callback
 */
module.exports = function( grunt, repositoryName, callback ) {

  var fullResImageName = 'assets/' + repositoryName + '-screenshot.png';
  var destinationFile = BUILD_DIRECTORY + '/' + repositoryName + '-twitter-card.png';

  if ( !grunt.file.exists( fullResImageName ) ) {
    grunt.log.writeln( 'no image file exists: ' + fullResImageName + '. Not running task: generate-thumbnails' );
    return;
  }

  if ( !grunt.file.exists( BUILD_DIRECTORY ) ) {
    grunt.file.mkdir( BUILD_DIRECTORY );
  }
  assert( grunt.file.isDir( BUILD_DIRECTORY ), 'Error: "build" is not a directory' );

  // The following creates an 800x400 image that is a letter-boxed version of the original size image and has small transparent padding on the top and bottom.
  new Jimp( fullResImageName, function() { // eslint-disable-line
    this.resize( 600, 394 ) // Preserve original dimensions
      .contain( 585, 400 )  // Resize to allow padding on top/bottom
      .contain( 800, 400 )  // Add padding on right/left
      .write( destinationFile, callback );
  } );
};
