// Copyright 2015, University of Colorado Boulder

/**
 * Sorts require statements for each file in the js/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var sourceRoot = process.cwd() + '/js';

  // Count the number of start and end dates we need
  grunt.file.recurse( sourceRoot, function( abspath ) {

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
        if ( line.indexOf( ' = require( ' ) >= 0 ) {
          accumulator.push( line );
          count++;
        }
        else {

          // Not a require statement, sort and flush any pending require statements then continue
          accumulator.sort( function( a, b ) {

            // case insensitive
            return a.toLowerCase().localeCompare( b.toLowerCase() );
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
  } );
};