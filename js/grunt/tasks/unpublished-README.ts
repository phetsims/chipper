// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import generateREADME from '../generateREADME';

/**
 * Generates README.md file for an unpublished simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateREADME( repo, false /* published */ );
} )();