// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateA11yViewHTML from '../generateA11yViewHTML.js';

/**
 * Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should
 * set the "phet.simFeatures.supportsInteractiveDescription":true flag in the sim package.json and run `grunt update`
 * instead of manually generating this.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateA11yViewHTML( repo );
} )();