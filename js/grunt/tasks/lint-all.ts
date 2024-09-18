// Copyright 2024, University of Colorado Boulder

/**
 * Lints all JS files required to build this repository (for the specified brands)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import * as grunt from 'grunt';
import buildLocal from './util/buildLocal';
import getOption from './util/getOption';
import getRepo from './util/getRepo';
import isRunDirectly from './util/isRunDirectly.js';

const getBrands = require( './util/getBrands' );
const lint = require( '../lint' );

const repo = getRepo();

// --disable-eslint-cache disables the cache, useful for developing rules
const cache = !getOption( 'disable-eslint-cache' );
const fix = getOption( 'fix' );
const chipAway = getOption( 'chip-away' );
assert( !getOption( 'patterns' ), 'patterns not support for lint-all' );

const getPhetLibs = require( '../getPhetLibs' );

const brands = getBrands( grunt, repo, buildLocal );

/**
 * Executes the linting process.
 */
// eslint-disable-next-line default-export-match-filename
export default async function lintAll(): Promise<void> {
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
}

// Detect if the script is run directly
if ( isRunDirectly() ) {
  lintAll().catch( error => {
    console.error( 'Linting failed:', error );
    process.exit( 1 );
  } );
}