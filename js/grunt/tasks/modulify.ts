// Copyright 2013-2024, University of Colorado Boulder

import fs from 'fs';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateDevelopmentStrings from '../generateDevelopmentStrings.js';

// eslint-disable-next-line phet/default-import-match-filename
import _modulify from '../modulify.js';

/**
 * Creates *.js modules for all images/strings/audio/etc in a repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export const modulifyPromise = ( async () => {

  const repo = getRepo();

  await _modulify( repo );

  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
    generateDevelopmentStrings( repo );
  }
} )();