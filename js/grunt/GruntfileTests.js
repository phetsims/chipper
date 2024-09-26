// Copyright 2024, University of Colorado Boulder

/**
 * Test that we can invoke a grunt task from the command line, and make sure the options are passed correctly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */


const qunit = require( 'qunit' );
// eslint-disable-next-line phet/require-statement-match
const { execSync } = require( 'child_process' );
qunit.module( 'GruntfileTests' );

const gruntCommand = require( '../../../perennial-alias/js/common/gruntCommand' );

qunit.test( 'first test', assert => {

  const result = execSync( `${gruntCommand} test-grunt --brands=a,b,c --lint=false --noTSC`, { encoding: 'utf-8' } );
  console.log( 'got exec sync result: ' + result );
  console.log( result );

  assert.ok( result.includes( `<output>
brands: a,b,c
lint: false
noTSC: true
omitted: undefined
</output>` ), 'result should correctly parse and output the options' );
} );