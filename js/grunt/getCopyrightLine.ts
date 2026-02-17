// Copyright 2021-2024, University of Colorado Boulder

/**
 * Function that determines created and last modified dates from git, see #403. If the file is not tracked in git
 * then returns a copyright statement with the current year.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import execute from '../../../perennial-alias/js/common/execute.js';

/**
 * @param repo - The repository of the file to update (should be a git root)
 * @param relativeFile - The filename relative to the repository root.
 */
export default async ( repo: string, relativeFile: string ): Promise<string> => {

  let startDate = ( await execute( 'git', [
    'log', '--diff-filter=A', '--follow', '--date=short', '--format=%cd', '-1', '--', relativeFile
  ], `../${repo}` ) ).trim().split( '-' )[ 0 ];

  const endDate = ( await execute( 'git', [
    'log', '--follow', '--date=short', '--format=%cd', '-1', '--', relativeFile
  ], `../${repo}` ) ).trim().split( '-' )[ 0 ];

  let dateString = '';

  // git was unable to get any information about the file. Perhaps it is new or not yet tracked in get? Use the current year.
  if ( startDate === '' && endDate === '' ) {
    dateString = new Date().getFullYear() + '';
  }
  else {

    // There is a bug with the first git log command that sometimes yields a blank link as output
    // You can find occurrences of this by searching our repos for "Copyright 2002-"
    if ( startDate === '' ) {
      startDate = '2002';
    }

    // Create the single date or date range to use in the copyright statement
    dateString = ( startDate === endDate ) ? startDate : ( `${startDate}-${endDate}` );
  }

  return `// Copyright ${dateString}, University of Colorado Boulder`;
};