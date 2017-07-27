// Copyright 2015, University of Colorado Boulder

/**
 * Sorts require statements for each file in the js/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// 3rd-party packages
var _ = require( '../../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match

// constants
var KEY = ' = require( '; // the substring that is searched to find require statements

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var sourceRoot = process.cwd() + '/js';

  var sortRequireStatementsForFile = function( abspath ) {
    // only address js files
    if ( abspath.indexOf( '.js' ) ) {

      // read the file as text
      var text = grunt.file.read( abspath ).toString();

      // split by line
      var lines = text.split( /\r?\n/ );

      // full text
      var result = [];

      // accumulated require statement lines
      var accumulator = [];

      // total number of require statements
      var count = 0;

      for ( var i = 0; i < lines.length; i++ ) {
        var line = lines[ i ];

        // If it was a require statement, store it for sorting.
        if ( line.indexOf( KEY ) >= 0 ) {
          accumulator.push( line );
          count++;
        }
        else {

          // Not a require statement, sort and flush any pending require statements then continue
          accumulator = _.sortBy( accumulator, function( o ) {
            return o.toLowerCase().substring( o.indexOf( KEY ) );
          } );
          accumulator.forEach( function( a ) {
            result.push( a );
          } );
          accumulator.length = 0;
          result.push( line );
        }
      }

      // console.log( result.join( '\n' ) );
      grunt.file.write( abspath, result.join( '\n' ) );
      console.log( 'sorted ' + count + ' require statements in ' + abspath );
    }
  };

  // option to sort a single file
  var file = grunt.option( 'file' );
  if ( file ) {
    sortRequireStatementsForFile( file );
  }
  else {
    grunt.file.recurse( sourceRoot, sortRequireStatementsForFile );
  }
};