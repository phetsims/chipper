// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * Generates README.md file for an unpublished simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

const generateREADME = require( './generateREADME' ); // used by multiple tasks
( async () => {
  await generateREADME( repo, false /* published */ );
} )();