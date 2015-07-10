// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a markdown form of sherpa/third-party-licenses.json and automatically commits it.
 * The output can be observed at https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * @author Aaron Davis
 * @author Sam Reid
 */

var child_process = require( 'child_process' );
var assert = require( 'assert' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path
var OUTPUT_FILE = 'third-party-licenses.md';
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var json = grunt.file.readJSON( SHERPA + '/third-party-licenses.json' );

  var entries = [];

  for ( var library in json ) {

    // check for existence of the license file
    if ( !fs.existsSync( LICENSES_DIRECTORY + library + '.txt' ) ) {
      grunt.log.error( 'license file not found for ' + library );
    }

    var lines = [
      '**' + library + '**',
      json[ library ].text.join( '<br>' ),
      json[ library ].projectURL,
      json[ library ].license + '  ' + json[ library ].licenseURL,
      json[ library ].notes
    ];

    // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when 
    // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
    entries.push( lines.join( '<br>' ) );
  }

  var output = entries.join( '\n\n' );

  // It is sometimes convenient to iterate using GitHub issue preview rather than committing every time.
  // In this case, you may want to comment out the commit below.
  grunt.log.debug( '!!!!!! BEGIN LICENSES OUTPUT' );
  grunt.log.debug( output );
  grunt.log.debug( '!!!!!! END LICENSES OUTPUT' );

  grunt.log.writeln( 'writing file ' + OUTPUT_FILE );
  grunt.file.write( SHERPA + '/' + OUTPUT_FILE, output );

  //var done = grunt.task.current.async();

  // exec a command in the sherpa directory
  //var exec = function( command, callback ) {
  //  child_process.exec( command, { cwd: SHERPA }, function( err, stdout, stderr ) {
  //    grunt.log.writeln( stdout );
  //    grunt.log.writeln( stderr );
  //    assert( !err, 'assertion error running ' + command );
  //    callback();
  //  } );
  //};
  //
  //exec( 'git add ' + OUTPUT_FILE, function() {
  //  exec( 'git commit --message "updated info.md"', function() {
  //    exec( 'git push', function() {
  //      done();
  //    } );
  //  } );
  //} );
};