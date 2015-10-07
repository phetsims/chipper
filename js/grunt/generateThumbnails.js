// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates 128x84 and 600x394 thumbnails of the sim's screenshot in assets.
 * Thumbnails are put in the build directory of the sim. If the directory doesn't exist, it is created.
 * New grunt tasks can easily be created to generate different sized images by passing this function
 * different heights and widths.
 *
 * @author Aaron Davis
 */

// modules
var Jimp = require( 'jimp' );
var assert = require( 'assert' );

// constants
var BUILD_DIRECTORY = 'build';

/**
 * @param grunt - the grunt instance
 * @param {string} repositoryName - name of the repository
 * @param {number} width of the resized image
 * @param {number} height of the resized image
 * @param {function} callback
 */
module.exports = function( grunt, repositoryName, width, height, callback ) {
  'use strict';

  var fullResImageName = 'assets/' + repositoryName + '-screenshot.png';
  var destinationFile = BUILD_DIRECTORY + '/' + repositoryName + '-' + width + '.png';

  if ( !grunt.file.exists( fullResImageName ) ) {
    grunt.log.writeln( 'no image file exists: ' + fullResImageName + '. Not running task: generate-thumbnails' );
    return;
  }

  if ( !grunt.file.exists( BUILD_DIRECTORY ) ) {
    grunt.file.mkdir( BUILD_DIRECTORY );
  }
  assert( grunt.file.isDir( BUILD_DIRECTORY ), 'Error: "build" is not a directory' );

  new Jimp( fullResImageName, function() { //eslint-disable-line no-new
    this.resize( width, height ).write( destinationFile, callback );
  } );
};
