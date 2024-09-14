// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const getRepo = require( './util/getRepo' );
const grunt = require( 'grunt' );
const getOption = require( './util/getOption' );
const sortImports = require( '../sortImports' );

const repo = getRepo();
const file = getOption( 'file' );

if ( file ) {
  sortImports( file );
}
else {
  grunt.file.recurse( `../${repo}/js`, absfile => sortImports( absfile ) );
}