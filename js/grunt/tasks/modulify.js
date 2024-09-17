// Copyright 2024, University of Colorado Boulder
const getRepo = require( './util/getRepo' );
const modulify = require( '../modulify' );
const generateDevelopmentStrings = require( '../../scripts/generateDevelopmentStrings' );
const fs = require( 'fs' );

/**
 * Creates *.js modules for all images/strings/audio/etc in a repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await modulify( repo );

  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
    generateDevelopmentStrings( repo );
  }
} )();