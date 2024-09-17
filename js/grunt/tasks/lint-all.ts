// Copyright 2024, University of Colorado Boulder

import getRepo from './util/getRepo';
const getBrands = require( './util/getBrands' );
const assert = require( 'assert' );
import * as grunt from 'grunt';
const lint = require( '../lint' );

/**
 * lint all js files that are required to build this repository (for the specified brands)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const repo = getRepo();

import getOption from './util/getOption';
const buildLocal = require( './util/buildLocal' );

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