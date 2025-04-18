// Copyright 2013-2025, University of Colorado Boulder

/**
 * Generates top-level SIM_en.html file based on the preloads in package.json.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateDevelopmentHTML from '../generateDevelopmentHTML.js';

const repo = getRepo();

( async () => {
  await generateDevelopmentHTML( repo );
} )();