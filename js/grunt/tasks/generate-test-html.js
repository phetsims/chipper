// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );
const generateTestHTML = require( '../generateTestHTML' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateTestHTML( repo );
} )();