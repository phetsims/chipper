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
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const path = require( 'path' );

module.exports = function chipAway( results ) {
  const repos = results.map( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] );
  const uniqueRepos = _.uniq( repos ).filter( repo => repo !== 'perennial-alias' );

  // NOTE: This should never be run in a maintenance mode since this loads a file from phet-info which
  // does not have its SHA tracked as a dependency.
  // TODO: For the reviewer, is this OK? https://github.com/phetsims/chipper/issues/1253
  const responsibleDevs = JSON.parse( fs.readFileSync( '../phet-info/sim-info/responsible_dev.json' ) );

  // We only want a list of repos that report lint errors
  const reposWithErrors = uniqueRepos.filter( repo => {
    return errorReport( results, repo ).errorCount > 0;
  } );

  // Format chip away assignments. '{{REPO}} @github # errors in # files'
  const assignments = reposWithErrors.map( repo => {
    const fileCount = errorReport( results, repo ).fileCount;
    const errorCount = errorReport( results, repo ).errorCount;

    return ` - [ ] ${repo}: ${responsibleDevs[ repo ].responsibleDevs.join( ', ' )} ${errorCount} errors in ${fileCount} files.`;
  } );
  console.log( assignments.join( '\n' ) );
};

function errorReport( results, repo ) {
  const filteredResults = results.filter( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] === repo );
  const fileCount = filteredResults.filter( result => result.errorCount + result.warningCount > 0 ).length;
  const errorCount = _.sum( filteredResults.map( file => file.errorCount + file.warningCount ) );

  return { errorCount: errorCount, fileCount: fileCount };
}
