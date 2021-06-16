[object Promise]

/**
 * This grunt task generates the README.md file for a simulation.
 * Placeholders in a template file are replaced with values specific to the simulation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

'use strict';

const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fixEOL = require( './fixEOL' );
const getPhetLibs = require( './getPhetLibs' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );

/**
 * @param {string} repo - name of the repository
 * @param {boolean} published - has the sim been published?
 */
module.exports = function( repo, published ) {

  // Read the title from the English strings file.
  const simTitleStringKey = getTitleStringKey( repo );
  const strings = grunt.file.readJSON( `../${repo}/${repo}-strings_en.json` );
  const titleKey = simTitleStringKey.split( '/' ).pop(); // eg. 'EXAMPLE_SIM/example-sim.title' -> 'example-sim.title'
  const title = strings[ titleKey ].value;
  const phetLibs = getPhetLibs( repo, 'phet' );

  // Commands for cloning all required repositories
  const cloneCommands = phetLibs.map( phetLib => `git clone https://github.com/phetsims/${phetLib}.git` ).join( '\n' );

  // Read the template.
  const templateFile = published ? 'README-published.md' : 'README-unpublished.md';
  let readme = grunt.file.read( `../chipper/templates/${templateFile}` );

  // Replace placeholders in the template.
  readme = ChipperStringUtils.replaceAll( readme, '{{REPOSITORY}}', repo );
  readme = ChipperStringUtils.replaceAll( readme, '{{TITLE}}', title );
  readme = ChipperStringUtils.replaceAll( readme, '{{CLONE_COMMANDS}}', cloneCommands );

  // Write to the repository's root directory.
  grunt.file.write( `../${repo}/README.md`, fixEOL( readme ) );
};