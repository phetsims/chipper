// Copyright 2013-2024, University of Colorado Boulder

/**
 * Lints all JS files required to build this repository (for the specified brands)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
import lint from '../../../../perennial-alias/js/grunt/lint.js';
import getBrands from '../../../../perennial-alias/js/grunt/tasks/util/getBrands.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import parseLintOptions from '../../../../perennial-alias/js/grunt/tasks/util/parseLintOptions.js';
import getPhetLibs from '../getPhetLibs.js';

const repo = getRepo();

const brands = getBrands( grunt, repo );

/**
 * Executes the linting process immediately. Additionally returned in case the client wants to await the task.
 */
export const lintAll = ( async () => {

  const lintReturnValue = await lint( parseLintOptions( { repos: getPhetLibs( repo, brands ) } ) );

  // Output results on errors.
  if ( !lintReturnValue.ok ) {
    grunt.fail.fatal( 'Lint failed' );
  }
  else {
    console.log( 'Linting completed successfully.' );
  }
} )();