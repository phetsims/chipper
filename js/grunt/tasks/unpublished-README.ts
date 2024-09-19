// Copyright 2013-2024, University of Colorado Boulder

import generateREADME from '../generateREADME';
import getRepo from './util/getRepo';

/**
 * Generates README.md file for an unpublished simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateREADME( repo, false /* published */ );
} )();