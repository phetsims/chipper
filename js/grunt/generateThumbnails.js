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
 * @param grunt the grunt instance
 * @param projectName of the project (repository)
 * @param width of the resized image
 * @param height of the resized image
 */
module.exports = function( grunt, projectName, width, height ) {
  'use strict';

  var fullResImageName = 'assets/' + projectName + '-screenshot.png';
  var destinationFile = 'build/' + projectName + '-' + width + '.png';

  if ( !grunt.file.exists( fullResImageName ) ) {
    grunt.log.writeln( 'no image file exists: ' + fullResImageName + '. Not running task: generate-thumbnails' );
    return;
  }

  if ( !grunt.file.exists( 'build' ) ) {
    grunt.file.mkdir( 'build' );
  }

  var done = grunt.task.current.async();

  // W031 says "do not use new for side effects."
  // It is disabled here because Jimp takes a callback that does the image processing.
  /* jshint -W031 */
  new Jimp( fullResImageName, function() {
    this.resize( width, height ).write( destinationFile, done );
  } );
  /* jshint +W031 */
};
