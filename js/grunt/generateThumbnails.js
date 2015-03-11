// Copyright 2002-2015, University of Colorado Boulder

var Jimp = require( 'jimp' );

/**
 * Generate 128x84 and 600x394 thumbnails of the sim's screenshot in assets
 *
 * @param grunt
 * @param projectName of the project (repository)
 * @param width
 * @param height
 */
module.exports = function( grunt, projectName, width, height ) {
  'use strict';

  var fullResImageName = 'assets/' + projectName + '-screenshot.png';
  var destinationFile = 'build/' + projectName + '-' + width + '.png';

  if ( !grunt.file.exists( fullResImageName ) ) {
    console.log( 'no image file exists: ' + fullResImageName + '. Not running task: generate-thumbnails' );
    return;
  }

  if ( !grunt.file.exists( 'build' ) ) {
    grunt.file.mkdir( 'build' );
  }

  var done = grunt.task.current.async();

  /* jshint -W031 */
  new Jimp( fullResImageName, function() {
    this.resize( width, height ).write( destinationFile, done );
  } );
};
