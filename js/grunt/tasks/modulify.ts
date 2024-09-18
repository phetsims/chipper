// Copyright 2013-2024, University of Colorado Boulder
import getRepo from './util/getRepo';
import * as fs from 'fs';
import isRunDirectly from './util/isRunDirectly.js';

const modulify = require( '../modulify' );
const generateDevelopmentStrings = require( '../generateDevelopmentStrings' );

/**
 * Creates *.js modules for all images/strings/audio/etc in a repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

// eslint-disable-next-line default-export-match-filename
export default async function _modulify(): Promise<void> {
  await modulify( repo );

  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
    generateDevelopmentStrings( repo );
  }
}

if ( isRunDirectly() ) {
  _modulify().catch( e => {
    console.error( e );
    process.exit( 1 );
  } );
}