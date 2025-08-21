// Copyright 2015-2024, University of Colorado Boulder

/**
 * This grunt task generates the README.md file for a simulation.
 * Placeholders in a template file are replaced with values specific to the simulation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { readFileSync } from 'fs';
import writeFileAndGitAdd from '../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getPhetLibs from './getPhetLibs.js';
import getTitleStringKey from './getTitleStringKey.js';

/**
 * @param repo - name of the repository
 * @param published - has the sim been published?
 */
export default async function( repo: string, published: boolean ): Promise<void> {

  // Read the title from the English strings file.
  const simTitleStringKey = getTitleStringKey( repo );
  const strings = JSON.parse( readFileSync( `../${repo}/${repo}-strings_en.json`, 'utf8' ) );
  const titleKey = simTitleStringKey.split( '/' ).pop()!; // eg. 'EXAMPLE_SIM/example-sim.title' -> 'example-sim.title'
  const title = strings[ titleKey ].value;
  const phetLibs = getPhetLibs( repo, 'phet' );

  phetLibs.sort();

  // Commands for cloning all required repositories
  const cloneCommands = phetLibs.map( ( phetLib: string ) => {

    return phetLib === 'perennial-alias' ?
           'git clone https://github.com/phetsims/perennial.git perennial-alias' :
           `git clone https://github.com/phetsims/${phetLib}.git`;
  } ).join( '\n' );

  // Read the template.
  const templateFile = published ? 'README-published.md' : 'README-unpublished.md';
  let readme = grunt.file.read( `../chipper/templates/${templateFile}` );

  // Replace placeholders in the template.
  readme = ChipperStringUtils.replaceAll( readme, '{{REPOSITORY}}', repo );
  readme = ChipperStringUtils.replaceAll( readme, '{{TITLE}}', title );
  readme = ChipperStringUtils.replaceAll( readme, '{{CLONE_COMMANDS}}', cloneCommands );

  // Write to the repository's root directory.
  await writeFileAndGitAdd( repo, 'README.md', readme );
}