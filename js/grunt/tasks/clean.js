// Copyright 2024, University of Colorado Boulder

/**
 * Erases the build/ directory and all its contents, and recreates the build/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const getRepo = require( './util/getRepo' );
const grunt = require( 'grunt' );

const repo = getRepo();
const buildDirectory = `../${repo}/build`;

// Check if the build directory exists, then delete and recreate it
if ( grunt.file.exists( buildDirectory ) ) {
  grunt.file.delete( buildDirectory );
}
grunt.file.mkdir( buildDirectory );