// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const repo = getRepo();

const sortImports = require( '../sortImports' );

const parseGruntOptions = require( './util/parseGruntOptions' );

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

const file = grunt.option( 'file' );

if ( file ) {
  sortImports( file );
}
else {
  grunt.file.recurse( `../${repo}/js`, absfile => sortImports( absfile ) );
}