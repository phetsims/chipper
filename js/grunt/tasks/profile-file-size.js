// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

const profileFileSize = require( '../grunt/profileFileSize' );

( async () => {
  await profileFileSize( repo );
} )();