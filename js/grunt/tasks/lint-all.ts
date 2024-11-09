// Copyright 2013-2024, University of Colorado Boulder

/**
 * Lints this repo and all of its dependencies.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
import getLintOptions from '../../../../perennial-alias/js/eslint/getLintOptions.js';
import lint from '../../../../perennial-alias/js/eslint/lint.js';
import getBrands from '../../../../perennial-alias/js/grunt/tasks/util/getBrands.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../getPhetLibs.js';

const repo = getRepo();

const brands = getBrands( repo );

/**
 * Executes the linting process immediately. Additionally returned in case the client wants to await the task.
 */
export const lintAll = ( async () => {

  const lintSuccess = await lint( getPhetLibs( repo, brands ), getLintOptions() );

  // Output results on errors.
  if ( !lintSuccess ) {
    grunt.fail.fatal( 'Lint failed' );
  }
  else {
    console.log( 'Linting completed successfully.' );
  }
} )();