// Copyright 2015, University of Colorado Boulder

/**
 * Grunt task that determines created and last modified dates from git, and updates copyright statements accordingly,
 * see #403
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const child_process = require( 'child_process' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const grunt = require( 'grunt' );

/**
 * @public
 * @param {string} sourceRoot - directory to start at
 * @param {function} predicate - takes an absolute path {string} and returns {boolean} if the path should be updated.
 * @returns {Promise}
 */
module.exports = function( sourceRoot, predicate = () => true ) {
  return new Promise( ( resolve, reject ) => {

    // Keep track of results from the git processes, key = absolute path, value = {startDate,endDate}
    const elements = {};

    // After every file has a startDate and endDate, update the files in the file system
    const updateAllFiles = function() {
      const keys = _.keys( elements );
      for ( let i = 0; i < keys.length; i++ ) {
        const absPath = keys[ i ];

        const startDate = elements[ absPath ].startDate;
        const endDate = elements[ absPath ].endDate;

        // Create the single date or date range to use in the copyright statement
        const dateString = ( startDate === endDate ) ? startDate : ( '' + startDate + '-' + endDate );

        const fileText = grunt.file.read( absPath );

        // Infer the line separator for the platform
        const firstR = fileText.indexOf( '\r' );
        const firstN = fileText.indexOf( '\n' );
        const lineSeparator = firstR >= 0 && firstR < firstN ? '\r' : '\n';

        // Parse by line separator
        const fileLines = fileText.split( lineSeparator ); // splits using both unix and windows newlines

        // Check if the first line is already correct
        const firstLine = fileLines[ 0 ];
        const copyrightLine = '// Copyright ' + dateString + ', University of Colorado Boulder';

        // Update the line
        if ( firstLine !== copyrightLine ) {
          if ( firstLine.indexOf( '// Copyright' ) === 0 ) {
            const concatted = [ copyrightLine ].concat( fileLines.slice( 1 ) );
            const newFileContents = concatted.join( lineSeparator );
            grunt.file.write( absPath, newFileContents );
            console.log( absPath + ', updated with ' + copyrightLine );
          }
          else {
            console.log( absPath + ' FIRST LINE WAS NOT COPYRIGHT: ' + firstLine );
          }
        }
      }

      resolve();
    };

    let count = 0;
    if ( grunt.file.exists( sourceRoot ) ) {

      // Count the number of start and end dates we need
      grunt.file.recurse( sourceRoot, function( abspath ) {
        if ( ChipperStringUtils.endsWith( abspath, '.js' ) && predicate( abspath ) ) {
          elements[ abspath ] = {};
          count++;// for getting start date
          count++;// for getting end date
        }
      } );

      // Using the git command, gather the dates specified
      const gatherDates = function( dateName, gitCommand ) {
        grunt.file.recurse( sourceRoot, function( abspath ) {
          if ( ChipperStringUtils.endsWith( abspath, '.js' ) && predicate( abspath ) ) {

            // Look up the GitHub dates for the file
            child_process.exec(
              gitCommand + abspath,
              function( error, stdout, stderr ) {
                assert( !error, 'ERROR on git log attempt: ' + stderr );
                const date = stdout.split( '-' )[ 0 ];
                elements[ abspath ][ dateName ] = date;
                count--;
                if ( count === 0 ) {
                  updateAllFiles();
                }
              } );
          }
        } );
      };

      // Gather the start dates
      gatherDates( 'startDate', 'git log --diff-filter=A --follow --date=short --format=%cd -1 -- ' );

      // Gather the end dates
      gatherDates( 'endDate', 'git log --follow --date=short --format=%cd -1 -- ' );
    }
  } );
};