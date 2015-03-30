// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task updates the last value in the version by one.  For example from 0.0.0-dev.12 to 0.0.0-dev.13
 * This updates the package.json and js/version.js files, and commits + pushes to git.
 * BEWARE: Do not run this task unless your git is clean, otherwise it will commit other work on your repo as well.
 *
 * @author Sam Reid
 */

var assert = require( 'assert' );
var child_process = require( 'child_process' );

/**
 * @param grunt the grunt instance
 * @param {string} version from package.json
 */
module.exports = function( grunt, version ) {
  'use strict';

  var lastDot = version.lastIndexOf( '.' );
  var number = parseInt( version.substring( lastDot + 1 ), 10 );
  var newNumber = number + 1;
  var newFullVersion = version.substring( 0, lastDot + 1 ) + newNumber;

  var replace = function( path, oldText, newText ) {
    var fullText = grunt.file.read( path );
    var firstIndex = fullText.indexOf( oldText );
    var lastIndex = fullText.lastIndexOf( oldText );
    assert( lastIndex === firstIndex, 'should only be one occurrence of the text string' );
    assert( lastIndex !== -1, 'should be at least one occurrence of the text string' );
    grunt.file.write( path, fullText.replace( oldText, newText ) );
    grunt.log.writeln( 'updated version in ' + path + ' from ' + oldText + ' to ' + newText );
  };

  // Write the new version to the package.json file and version.js file
  replace( 'package.json', version, newFullVersion );
  replace( 'js/version.js', version, newFullVersion );

  var command1 = 'git add js/version.js package.json';
  var command2 = 'git commit -m "updated version to ' + newFullVersion + '"';
  var command3 = 'git push';

  grunt.log.writeln( 'Running: ' + command1 );
  var done = grunt.task.current.async();

  child_process.exec( command1, function( error1, stdout1, stderr1 ) {

    assert( !error1, "error in " + command1 );
    grunt.log.writeln( 'finished ' + command1 );
    grunt.log.writeln( stdout1 );

    grunt.log.writeln( 'Running: ' + command2 );
    child_process.exec( command2, function( error2, stdout2, stderr2 ) {
      assert( !error2, "error in git commit" );
      grunt.log.writeln( 'finished ' + command2 );
      grunt.log.writeln( stdout2 );

      grunt.log.writeln( 'Running: ' + command3 );
      child_process.exec( command3, function( error3, stdout3, stderr3 ) {
        assert( !error3, "error in git push" );
        grunt.log.writeln( 'finished ' + command3 );
        grunt.log.writeln( stdout3 );
        done();
      } );
    } );
  } );
};
