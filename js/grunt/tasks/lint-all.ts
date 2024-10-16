// Copyright 2013-2024, University of Colorado Boulder

/**
 * Lints all JS files required to build this repository (for the specified brands)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import * as grunt from 'grunt';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';

const getBrands = require( '../../../../perennial-alias/js/grunt/tasks/util/getBrands' );
const lint = require( '../lint' );

const repo = getRepo();

// --disable-eslint-cache disables the cache, useful for developing rules
const cache = !getOption( 'disable-eslint-cache' );
const fix = getOption( 'fix' );
const chipAway = getOption( 'chip-away' );
assert( !getOption( 'patterns' ), 'patterns not support for lint-all' );

const getPhetLibs = require( '../getPhetLibs' );

const brands = getBrands( grunt, repo );

/**
 * Executes the linting process immediately. Additionally returned in case the client wants to await the task.
 */
export const lintAll = ( async () => {

  const lintReturnValue = await lint( getPhetLibs( repo, brands ), {
    cache: cache,
    fix: fix,
    chipAway: chipAway
  } );

  // Output results on errors.
  if ( !lintReturnValue.ok ) {
    grunt.fail.fatal( 'Lint failed' );
  }
  else {
    console.log( 'Linting completed successfully.' );
  }
} )();