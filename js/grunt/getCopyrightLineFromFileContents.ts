// Copyright 2025, University of Colorado Boulder

/**
 * Read the copyright line from a file, if it exists, or fall back to getCopyrightLine otherwise.
 * This is used as a performance optimization over calling git operations each time.
 * See https://github.com/phetsims/chipper/issues/1624
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import getCopyrightLine from './getCopyrightLine.js';

/**
 * @param repo - The repository of the file to update (should be a git root)
 * @param relativeFile - The filename relative to the repository root.
 */
export default async ( repo: string, relativeFile: string ): Promise<string> => {

  if ( fs.existsSync( `../${repo}/${relativeFile}` ) ) {
    const fileContents = fs.readFileSync( `../${repo}/${relativeFile}`, 'utf8' );
    if ( fileContents.startsWith( '// Copyright ' ) ) {

      // return the 1st line
      const firstLine = fileContents.split( '\n' )[ 0 ];
      return firstLine.trim();
    }
  }
  return getCopyrightLine( repo, relativeFile );
};