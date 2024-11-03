// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../getPhetLibs.js';
import transpile, { getTranspileOptions } from '../transpile.js';

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * NOTE: We need to keep the name output-js-project because of maintenance tooling. This name should never change,
 * though SR and MK wish it was called "transpile-project".
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
transpile( getTranspileOptions( {
  repos: getPhetLibs( getRepo() ),
  silent: true
} ) );