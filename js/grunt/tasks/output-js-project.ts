// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../getPhetLibs';
import transpile, { getTranspileOptions } from '../transpile.js';

/**
 * Outputs JS for the specified repo and its dependencies
 * TODO: We need output-js-project because of maintenance tooling, but should we add a duplicate for `transpile-project`? https://github.com/phetsims/chipper/issues/1499
 * TODO: output-js-project --watch does not work. Transpiler.watch() hard codes active repos (let's wait to fix for swc), https://github.com/phetsims/chipper/issues/1499
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
transpile( getTranspileOptions( {
  repos: getPhetLibs( getRepo() ),
  silent: true
} ) );