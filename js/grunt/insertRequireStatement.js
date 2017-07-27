// Copyright 2015, University of Colorado Boulder

/**
 * Inserts a require statement in the given file
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

var assert = require( 'assert' ); // eslint-disable-line require-statement-match
var fs = require( 'fs' );
var sortRequireStatements = require( '../../../chipper/js/grunt/sortRequireStatements' );

// constants
var KEY = ' = require( '; // the substring that is searched to find require statements

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  // option to sort a single file
  var file = grunt.option( 'file' );
  var name = grunt.option( 'name' );

  assert && assert( file, 'file should be defined' );
  assert && assert( name, 'name should be defined' );

  var activeSims = fs.readFileSync( '../chipper/data/active-repos' ).toString();
  activeSims = activeSims.split( /\r?\n/ );
  activeSims.length = activeSims.length - 1;

  var simulationRoot = process.cwd();

  var statement = null;
  try {

    // Search over all active sims for a require statement that matches the desired one
    for ( var k = 0; k < activeSims.length; k++ ) {
      var simPath = simulationRoot + '/../' + activeSims[ k ] + '/js';
      if ( grunt.file.exists( simPath ) ) {
        grunt.file.recurse( simPath, function( absolutePath ) {
          var t = grunt.file.read( absolutePath, 'utf8' );
          var index = t.indexOf( 'var ' + name + ' = require( \'' );
          if ( index >= 0 ) {
            var nextEndLine = t.indexOf( '\n', index );
            var substring = t.substring( index, nextEndLine );

            // poor man's way out of recursion
            throw substring;
          }
        } );
      }
    }
  }
  catch( x ) {

    // poor man's way out of recursion
    console.log( x );
    statement = x;
  }

  if ( !statement ) {
    grunt.log.warn( 'no import found for ' + name );
  }
  else {

    // read the file as text
    var text = grunt.file.read( file ).toString();

    // split by line
    var lines = text.split( /\r?\n/ );

    // full text
    var result = [];
    var inserted = false;

    for ( var i = 0; i < lines.length; i++ ) {
      var line = lines[ i ];

      // If it was a require statement, store it for sorting.
      if ( line.indexOf( KEY ) >= 0 && !inserted ) {
        result.push( '  ' + statement );
        inserted = true;
      }
      result.push( line );
    }

    grunt.file.write( file, result.join( '\n' ) );
    grunt.log.writeln( 'inserted a require statements in ' + file );

    // Make sure it ends up in the right place
    sortRequireStatements( grunt, file );
  }
};