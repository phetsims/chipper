// Copyright 2013-2025, University of Colorado Boulder

/**
 * Lints this repo and all of its dependencies.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import getLintCLIOptions from '../../../../perennial-alias/js/eslint/getLintCLIOptions.js';
import lint from '../../../../perennial-alias/js/eslint/lint.js';
import getBrands from '../../../../perennial-alias/js/grunt/tasks/util/getBrands.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../getPhetLibs.js';

const repo = getRepo();

const brands = getBrands( repo );

/**
 * Executes the linting process immediately. Additionally returned in case the client wants to await the task.
 * We wish this was "export default" but cannot get type information to work for the dynamic import(). See https://github.com/phetsims/perennial/issues/375#issuecomment-2477665963
 */
export const lintProjectPromise = ( async () => {
  const lintSuccess = await lint( getPhetLibs( repo, brands ), getLintCLIOptions() );

  // Output results on errors.
  if ( !lintSuccess ) {
    console.log( 'Lint failed' );
    process.exit( 1 );
  }
  else {
    console.log( 'Linting completed successfully.' );
  }
} )();