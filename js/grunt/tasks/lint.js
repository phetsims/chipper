// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const getRepo = require( './util/getRepo' );
const lint = require( '../lint' );
const parseGruntOptions = require( './util/parseGruntOptions' );

const repo = getRepo();

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

( async () => {
  const cache = !grunt.option( 'disable-eslint-cache' );
  const fix = grunt.option( 'fix' );
  const chipAway = grunt.option( 'chip-away' );

  const extraRepos = grunt.option( 'repos' ) ? grunt.option( 'repos' ).split( ',' ) : [];

  const lintReturnValue = await lint( [ repo, ...extraRepos ], {
    cache: cache,
    fix: fix,
    chipAway: chipAway
  } );

  if ( !lintReturnValue.ok ) {
    grunt.fail.fatal( 'Lint failed' );
  }
} )();