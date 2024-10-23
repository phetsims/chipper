// Copyright 2013-2024, University of Colorado Boulder

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import transpile, { getTranspileOptions } from '../transpile.js';

/**
 * Main entrypoint for transpiling the PhET codebase to js. See transpile() for API. Outputs JS just
 * for the specified repo by default.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

( async () => {
  await transpile( getTranspileOptions( {
    all: getOption( 'all', true )
  } ) );
} )();