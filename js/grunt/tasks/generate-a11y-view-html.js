// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const generateA11yViewHTML = require( '../generateA11yViewHTML' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateA11yViewHTML( repo );
} )();