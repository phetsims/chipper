// Copyright 2024, University of Colorado Boulder

/**
 * Test that lint is behaving as expected. This file should be linted as if it is a node-like file.
 *
 * TODO: Delete when https://github.com/phetsims/chipper/issues/1465 is closed
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// eslint-disable-next-line @typescript-eslint/no-floating-promises
( async () => {

  // @ts-expect-error
  // eslint-disable-next-line no-undef
  console.log( AudioWorklet );

  console.log( process );

  const lodash = require( 'lodash' );
  console.log( lodash );
} )();