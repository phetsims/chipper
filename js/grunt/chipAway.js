// Copyright 2022, University of Colorado Boulder

/**
 * Produces an assignment list of responsible devs. Run from lint.js
 *
 * The Chip Away option provides a quick and easy method to assign devs to their respective repositories
 * for ease in adopting and applying new typescript linting rules.
 * Chip Away will return a markdown formatted checklist with the repository name, responsible dev,
 * and number of errors.
 * Response  format:
 * - [ ] {{REPO}}: @{{GITHUB_USERNAME}} {{NUMBER}} errors in {{NUMBER}} files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Marla Schulz (PhET Interactive Simulations)
 */

const fs = require( 'fs' );
const _ = require( 'lodash' );
const path = require( 'path' );

/**
 * @param {ESLint.LintResult[]} results - the results from eslint.lintFiles( patterns )
 *                                      - { filePath: string, errorCount: number, warningCount: number }
 *                                      - see https://eslint.org/docs/latest/developer-guide/nodejs-api#-lintresult-type
 * @returns {string} - a message with the chip-away checkboxes in GitHub markdown format, or a message describing why it
 *                   - could not be accomplished
 */
module.exports = results => {

  // NOTE: This should never be run in a maintenance mode since this loads a file from phet-info which
  // does not have its SHA tracked as a dependency.
  let responsibleDevs = null;
  try {
    responsibleDevs = JSON.parse( fs.readFileSync( '../phet-info/sim-info/responsible_dev.json' ) );
  }
  catch( e ) {

    // set responsibleDevs to an empty object if the file cannot be found or is not parseable.
    // In this scenario, responsibleDev info would not be logged with other repo error info.
    responsibleDevs = {};
  }

  const repos = results.map( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] );
  const assignments = _.uniq( repos ).map( repo => {

    const filteredResults = results.filter( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] === repo );
    const fileCount = filteredResults.filter( result => result.errorCount + result.warningCount > 0 ).length;
    const errorCount = _.sum( filteredResults.map( file => file.errorCount + file.warningCount ) );

    if ( errorCount === 0 || repo === 'perennial-alias' ) {
      return null;
    }
    else {
      const usernames = responsibleDevs[ repo ] ? responsibleDevs[ repo ].responsibleDevs.join( ', ' ) : '';
      return ` - [ ] ${repo}: ${usernames} ${errorCount} errors in ${fileCount} files.`;
    }
  } );

  return assignments.filter( assignment => assignment !== null ).join( '\n' );
};