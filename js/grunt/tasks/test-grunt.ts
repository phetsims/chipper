// Copyright 2024, University of Colorado Boulder
/**
 * Run internal tests for the Gruntfile. Note the output is reported over console.log, so be careful what you output.
 * The command invoked is something like this: execSync( `${gruntCommand} test-grunt --brands=a,b,c --lint=false --noTSC` )
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';

// grunt test-grunt --brands=a,b,c --lint=false --noTSC
const brands = getOption( 'brands' );
const lint = getOption( 'lint' );
const noTSC = getOption( 'noTSC' );
const omitted = getOption( 'omitted' );

console.log( '<output>' );
console.log( `brands: ${brands}` );
console.log( `lint: ${lint}` );
console.log( `noTSC: ${noTSC}` );
console.log( `omitted: ${omitted}` );
console.log( '</output>' );