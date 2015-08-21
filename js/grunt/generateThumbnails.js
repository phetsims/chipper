// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates 128x84 and 600x394 thumbnails of the sim's screenshot in assets.
 * Thumbnails are put in the build directory of the sim. If the directory doesn't exist, it is created.
 * New grunt tasks can easily be created to generate different sized images by passing this function
 * different heights and widths.
 *
 * @author Aaron Davis
 */

var Jimp = require( 'jimp' );

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
  var destinationFile = 'build/' + repositoryName + '-' + width + '.png';

  if ( !grunt.file.exists( fullResImageName ) ) {
    grunt.log.writeln( 'no image file exists: ' + fullResImageName + '. Not running task: generate-thumbnails' );
    return;
  }

  //TODO handle the case where build is not a directory, see grunt.file.isDir
  if ( !grunt.file.exists( 'build' ) ) {
    grunt.file.mkdir( 'build' );
  }

  // W031 says "do not use new for side effects."
  // It is disabled here because Jimp takes a callback that does the image processing.
  /* jshint -W031 */
  new Jimp( fullResImageName, function() {
    this.resize( width, height ).write( destinationFile, callback );
  } );
  /* jshint +W031 */
};
