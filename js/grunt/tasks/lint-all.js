// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const getBrands = require( './util/getBrands' );
const assert = require( 'assert' );
const grunt = require( 'grunt' );
const lint = require( '../lint' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const repo = getRepo();

const parseGruntOptions = require( './util/parseGruntOptions' );

// Initialize Grunt options with parsed arguments
// Call this before getBrands.
// TODO: Should getBrands just call this again to be safe? https://github.com/phetsims/chipper/issues/1459
grunt.option.init( parseGruntOptions() );

// Handle the lack of build.json
let buildLocal;
try {
  buildLocal = grunt.file.readJSON( `${process.env.HOME}/.phet/build-local.json` );
}
catch( e ) {
  buildLocal = {};
}

// --disable-eslint-cache disables the cache, useful for developing rules
const cache = !grunt.option( 'disable-eslint-cache' );
const fix = grunt.option( 'fix' );
const chipAway = grunt.option( 'chip-away' );
assert && assert( !grunt.option( 'patterns' ), 'patterns not support for lint-all' );

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