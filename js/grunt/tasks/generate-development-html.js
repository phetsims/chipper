// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const generateDevelopmentHTML = require( '../generateDevelopmentHTML' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateDevelopmentHTML( repo );
} )();