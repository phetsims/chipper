// Copyright 2024, University of Colorado Boulder

import getRepo from './util/getRepo';
const generateDevelopmentHTML = require( '../generateDevelopmentHTML' );

/**
 * Generates top-level SIM_en.html file based on the preloads in package.json.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateDevelopmentHTML( repo );
} )();