// Copyright 2013-2024, University of Colorado Boulder

/**
 * lint js files. Options:
 * --disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.
 * --fix: autofixable changes will be written to disk
 * --chip-away: output a list of responsible devs for each repo with lint problems
 * --repos: comma separated list of repos to lint in addition to the repo from running
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
import * as grunt from 'grunt';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import lint from '../lint';

const repo = getRepo();

export const lintTask = ( async () => {
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