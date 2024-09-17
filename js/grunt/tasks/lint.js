// Copyright 2024, University of Colorado Boulder

/**
 * lint js files. Options:
 * --disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.
 * --fix: autofixable changes will be written to disk
 * --chip-away: output a list of responsible devs for each repo with lint problems
 * --repos: comma separated list of repos to lint in addition to the repo from running
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const getRepo = require( './util/getRepo' );
const lint = require( '../lint' );
const getOption = require( './util/getOption' );

const repo = getRepo();

( async () => {
  const cache = !getOption( 'disable-eslint-cache' );
  const fix = getOption( 'fix' );
  const chipAway = getOption( 'chip-away' );

  const extraRepos = getOption( 'repos' ) ? getOption( 'repos' ).split( ',' ) : [];

  const lintReturnValue = await lint( [ repo, ...extraRepos ], {
    cache: cache,
    fix: fix,
    chipAway: chipAway
  } );

  if ( !lintReturnValue.ok ) {
    grunt.fail.fatal( 'Lint failed' );
  }
} )();