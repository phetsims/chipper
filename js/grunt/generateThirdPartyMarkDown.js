// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a markdown form of sherpa/third-party-licenses.json.
 *
 * @author Aaron Davis
 */

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var json = grunt.file.readJSON( '../sherpa/third-party-licenses.json' );
  var i;

  var columnHeaders = [ 'Library', 'Website', 'License', 'License URL', 'Text', 'Notes' ];
  var headerDelimiters = [];
  for ( i = 0; i < columnHeaders.length; i++ ) {
    headerDelimiters.push( '---------' );
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

  grunt.log.writeln( output );

};
