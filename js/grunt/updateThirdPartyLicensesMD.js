// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a markdown form of sherpa/lib/license.json and automatically commits it.
 * The output can be observed at https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * @author Aaron Davis
 * @author Sam Reid
 */

var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path
var OUTPUT_FILE = 'third-party-licenses.md';
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var json = grunt.file.readJSON( SHERPA + '/lib/license.json' );

  var entries = [];
  var licensesUsed = [];

  // Get a list of the library names
  var libraries = [];
  for ( var lib in json ) {
    libraries.push( lib );
  }

  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  libraries.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Add info for each library to the MD report
  for ( var i = 0; i < libraries.length; i++ ) {
    var library = libraries[ i ];

    // check for existence of the license file
    if ( !fs.existsSync( LICENSES_DIRECTORY + library + '.txt' ) ) {
      grunt.log.error( 'license file not found for ' + library );
    }

    var lines = [
      '**' + library + '**',
      json[ library ].text.join( '<br>' ),
      json[ library ].projectURL,
      'License: [' + json[ library ].license + '](licenses/' + library + '.txt)',
      'Notes: ' + json[ library ].notes
    ];

    if ( json[ library ].dependencies ) {
      lines.push( 'Dependencies: **' + json[ library ].dependencies + '**' );
    }

    // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when 
    // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
    entries.push( lines.join( '<br>' ) );

    if ( licensesUsed.indexOf( json[ library ].license ) < 0 ) {
      licensesUsed.push( json[ library ].license );
    }
  }

  // Summarize licenses used
  var output = entries.join( '\n\n' ) + '\n\n' +
               '**Licenses Used:**<br>' +
               licensesUsed.join( '<br>' );

  // It is sometimes convenient to iterate using GitHub issue preview rather than committing every time.
  // In this case, you may want to comment out the commit below.
  grunt.log.debug( '!!!!!! BEGIN LICENSES OUTPUT' );
  grunt.log.debug( output );
  grunt.log.debug( '!!!!!! END LICENSES OUTPUT' );

  grunt.log.writeln( 'writing file ' + OUTPUT_FILE );
  grunt.file.write( SHERPA + '/' + OUTPUT_FILE, output );

  var done = grunt.task.current.async();

  // exec a command in the sherpa directory
  var exec = function( command, callback ) {
    child_process.exec( command, { cwd: SHERPA }, function( err, stdout, stderr ) {
      grunt.log.writeln( stdout );
      grunt.log.writeln( stderr );
      assert( !err, 'assertion error running ' + command );
      callback();
    } );
  };

  exec( 'git add ' + OUTPUT_FILE, function() {
    exec( 'git commit --message "updated info.md"', function() {
      exec( 'git push', function() {
        done();
      } );
    } );
  } );
};