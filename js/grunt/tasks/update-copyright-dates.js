// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const updateCopyrightDates = require( '../updateCopyrightDates' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await updateCopyrightDates( repo );
} )();