// Copyright 2015, University of Colorado Boulder

/**
 * Updates the number after the last dot in the version in package.json.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );
var fs = require( 'fs' );

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  var packageJSON = JSON.parse( fs.readFileSync( 'package.json', { encoding: 'utf-8' } ) );
  var version = packageJSON.version;
  var lastNumber = parseInt( version.substring( version.lastIndexOf( '.' ) + 1 ), 10 );
  var nextNumber = lastNumber + 1;
  var newVersion = version.substring( 0, version.lastIndexOf( '.' ) + 1 ) + nextNumber;
  var fileString = grunt.file.read( 'package.json' );
  fileString = ChipperStringUtils.replaceFirst( fileString, version, newVersion );

  // bail if the same version appeared elsewhere
  if ( fileString.indexOf( version ) >= 0 ) {
    throw new Error( 'too many version matches' );
  }
  console.log( 'Updating version from ' + version + ' to ' + newVersion );
  grunt.file.write( 'package.json', fileString, { encoding: 'utf-8' } );

  var done = grunt.task.current.async();

  deployUtil.exec( grunt, 'git add package.json', function() {
    deployUtil.exec( grunt, 'git commit --message "Updated version to ' + newVersion + '"', function() {
      deployUtil.exec( grunt, 'git push', function() {
        console.log( 'finished commit and push' );
        done();
      } );
    } );
  } );
};