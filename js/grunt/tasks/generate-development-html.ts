// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateDevelopmentHTML from '../generateDevelopmentHTML.js';

/**
 * Generates top-level SIM_en.html file based on the preloads in package.json.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateDevelopmentHTML( repo );
} )();