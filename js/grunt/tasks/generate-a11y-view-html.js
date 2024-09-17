// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const generateA11yViewHTML = require( '../generateA11yViewHTML' );

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