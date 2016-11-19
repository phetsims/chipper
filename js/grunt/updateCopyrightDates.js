// Copyright 2015, University of Colorado Boulder

/**
 * Grunt task that determines created and last modified dates from git, and updates copyright statements accordingly,
 * see #403
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  // modules
  var child_process = require( 'child_process' );
  var assert = require( 'assert' );
  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match
  var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

  // constants
  var sourceRoot = process.cwd() + '/js';
  var done = grunt.task.current.async();

  // Keep track of results from the git processes, key = absolute path, value = {startDate,endDate}
  var elements = {};

  // After every file has a startDate and endDate, update the files in the file system
  var updateAllFiles = function() {
    var keys = _.keys( elements );
    for ( var i = 0; i < keys.length; i++ ) {
      var absPath = keys[ i ];

      var startDate = elements[ absPath ].startDate;
      var endDate = elements[ absPath ].endDate;

      // Create the single date or date range to use in the copyright statement
      var dateString = (startDate === endDate) ? startDate : ('' + startDate + '-' + endDate);

      var fileText = grunt.file.read( absPath );

      // Infer the line separator for the platform
      var firstR = fileText.indexOf( '\r' );
      var firstN = fileText.indexOf( '\n' );
      var lineSeparator = firstR >= 0 && firstR < firstN ? '\r' : '\n';

      // Parse by line separator
      var fileLines = fileText.split( lineSeparator ); // splits using both unix and windows newlines

      // Check if the first line is already correct
      var firstLine = fileLines[ 0 ];
      var copyrightLine = '// Copyright ' + dateString + ', University of Colorado Boulder';

      // Update the line
      if ( firstLine !== copyrightLine ) {
        if ( firstLine.indexOf( '// Copyright' ) === 0 ) {
          var concatted = [ copyrightLine ].concat( fileLines.slice( 1 ) );
          var newFileContents = concatted.join( lineSeparator );
          grunt.file.write( absPath, newFileContents );
          console.log( absPath + ', overwritten with ' + copyrightLine );
        }
        else {
          console.log( absPath + ' FIRST LINE WAS NOT COPYRIGHT: ' + firstLine );
        }
      }
      else {
        console.log( absPath + ' was already correct' );
      }
    }
  };

  var count = 0;
  if ( grunt.file.exists( sourceRoot ) ) {

    // Count the number of start and end dates we need
    grunt.file.recurse( sourceRoot, function( abspath ) {
      if ( ChipperStringUtils.endsWith( abspath, '.js' ) ) {
        elements[ abspath ] = {};
        count++;// for getting start date
        count++;// for getting end date
      }
    } );

    // Using the git command, gather the dates specified
    var gatherDates = function( dateName, gitCommand ) {
      grunt.file.recurse( sourceRoot, function( abspath ) {
        if ( ChipperStringUtils.endsWith( abspath, '.js' ) ) {

          // Look up the GitHub dates for the file
          child_process.exec(
            gitCommand + abspath,
            function( error, stdout, stderr ) {
              assert( !error, 'ERROR on git log attempt: ' + stderr );
              var date = stdout.split( '-' )[ 0 ];
              elements[ abspath ][ dateName ] = date;
              count--;
              if ( count === 0 ) {
                updateAllFiles();
                done();
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
};