// Copyright 2013-2024, University of Colorado Boulder

/**
 * Generates README.md file for a published simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateREADME from '../generateREADME.js';

const repo = getRepo();

( async () => {
  await generateREADME( repo, true /* published */ );
} )();