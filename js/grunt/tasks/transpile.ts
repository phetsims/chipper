// Copyright 2013-2024, University of Colorado Boulder

import transpile, { getTranspileOptions } from '../transpile.js';

/**
 * Main entrypoint for transpiling the PhET codebase to js. See transpile() for API. Outputs JS just
 * for the specified repo by default.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

( async () => {
  await transpile( getTranspileOptions( {
    all: true // TODO: Be able to turn this off. https://github.com/phetsims/chipper/issues/1499
  } ) );
} )();