// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const generateDevelopmentStrings = require( '../../scripts/generateDevelopmentStrings' );
const fs = require( 'fs' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
  generateDevelopmentStrings( repo );
}