// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a markdown form of sherpa/third-party-licenses.json.
 *
 * @author Aaron Davis
 */

// modules
var child_process = require( 'child_process' );
var assert = require( 'assert' );

// constants
var OUTPUT_FILE = 'info.md';
var SHERPA = '../sherpa';

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var json = grunt.file.readJSON( SHERPA + '/third-party-licenses.json' );
  var i;

  var columnHeaders = [ 'Library', 'Website', 'License', 'License URL (if different than project website)', 'Text', 'How is it used in sims?' ];
  var headerDelimiters = [];
  for ( i = 0; i < columnHeaders.length; i++ ) {
    headerDelimiters.push( '-----' );
  }
  var output = columnHeaders.join( '|' ) + '\n' + headerDelimiters.join( '|' );

  var rows = [];

  for ( var library in json ) {
    var text = json[ library ].text.join( '<br>' );
    var license = json[ library ].license;
    var projectURL = json[ library ].projectURL;
    var notes = json[ library ].notes;
    var licenseURL = json[ library ].licenseURL;
    rows.push( [ library, projectURL ? projectURL : '', license, licenseURL ? licenseURL : '', text, notes ] );
  }

  for ( i = 0; i < rows.length; i++ ) {
    var row = rows[ i ];
    output += '\n' + row.join( '|' );
  }

  grunt.log.writeln( 'writing file ' + OUTPUT_FILE );
  grunt.file.write( SHERPA + '/' + OUTPUT_FILE, output );

  var done = grunt.task.current.async();

  // exec a command in the sherpa directory
  var exec = function( command, callback ) {
    child_process.exec( command, { cwd: SHERPA }, function( err, stdout, stderr ) {
      grunt.log.writeln( stdout );
      grunt.log.writeln( stderr );
      assert( err, 'assertion error running ' + command );
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
