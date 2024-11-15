// Copyright 2013-2024, University of Colorado Boulder

import fs from 'fs';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import generateDevelopmentStrings from '../generateDevelopmentStrings.js';

/**
 * To support locales=* in unbuilt mode, generate a conglomerate JSON file for each repo with translations in babel. Run on all repos via:
 * * for-each.sh perennial-alias/data/active-repos npm install
 * * for-each.sh perennial-alias/data/active-repos grunt generate-development-strings
 *
 * This is not run in grunt update because it affects dependencies and outputs files outside of the repo.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) ) {
  generateDevelopmentStrings( repo );
}