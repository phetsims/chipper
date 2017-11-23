// Copyright 2017, University of Colorado Boulder

/**
 * Updates the number after the last dot in the version in package.json.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var fs = require( 'fs' );

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  var packageJSON = JSON.parse( fs.readFileSync( 'package.json', { encoding: 'utf-8' } ) );
  var version = packageJSON.version;

  // Find the number at which the last number begins
  var tailIndex = version.lastIndexOf( '.' ) + 1;

  var lastNumber = parseInt( version.substring( tailIndex ), 10 );
  var nextNumber = lastNumber + 1;
  var newVersion = version.substring( 0, tailIndex ) + nextNumber;
  var fileString = grunt.file.read( 'package.json' );
  fileString = ChipperStringUtils.replaceFirst( fileString, version, newVersion );

  // bail if the same version appeared elsewhere
  if ( fileString.indexOf( version ) >= 0 ) {
    throw new Error( 'too many version matches' );
  }
  grunt.log.writeln( 'Updating version from ' + version + ' to ' + newVersion );
  grunt.file.write( 'package.json', fileString, { encoding: 'utf-8' } );

  var done = grunt.task.current.async();

  deployUtil.exec( grunt, 'git add package.json', function() {
    deployUtil.exec( grunt, 'git commit --message "Updated version to ' + newVersion + '"', function() {
      deployUtil.exec( grunt, 'git push', function() {
        grunt.log.writeln( 'finished commit and push' );
        done();
      } );
    } );
  } );
};