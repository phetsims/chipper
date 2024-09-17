// Copyright 2024, University of Colorado Boulder

/**
 * lint all js files that are required to build this repository (for the specified brands)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import * as grunt from 'grunt';
import buildLocal from './util/buildLocal';
import getOption from './util/getOption';
import getRepo from './util/getRepo';

const getBrands = require( './util/getBrands' );
const lint = require( '../lint' );

const repo = getRepo();

// --disable-eslint-cache disables the cache, useful for developing rules
const cache = !getOption( 'disable-eslint-cache' );
const fix = getOption( 'fix' );
const chipAway = getOption( 'chip-away' );
assert && assert( !getOption( 'patterns' ), 'patterns not support for lint-all' );

const getPhetLibs = require( '../getPhetLibs' );

const brands = getBrands( grunt, repo, buildLocal );

( async () => {
  const lintReturnValue = await lint( getPhetLibs( repo, brands ), {
    cache: cache,
    fix: fix,
    chipAway: chipAway
  } );

// Output results on errors.
  if ( !lintReturnValue.ok ) {
    grunt.fail.fatal( 'Lint failed' );
  }
} )();