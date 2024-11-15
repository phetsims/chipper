// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateTestHTML from '../generateTestHTML.js';

/**
 * Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md
 * for more information on automated testing. Usually you should
 * set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateTestHTML( repo );
} )();