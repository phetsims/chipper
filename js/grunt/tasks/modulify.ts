// Copyright 2013-2024, University of Colorado Boulder
import getRepo from './util/getRepo';
import * as fs from 'fs';

// eslint-disable-next-line phet/require-statement-match
const _modulify = require( '../modulify' );
const generateDevelopmentStrings = require( '../generateDevelopmentStrings' );

/**
 * Creates *.js modules for all images/strings/audio/etc in a repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export const modulify = ( async () => {

  const repo = getRepo();

  await _modulify( repo );

  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
    generateDevelopmentStrings( repo );
  }
} )();