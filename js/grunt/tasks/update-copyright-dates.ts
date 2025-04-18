// Copyright 2013-2025, University of Colorado Boulder

/**
 * Update the copyright dates in JS source files based on Github dates
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import _ from 'lodash';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import getCopyrightLine from '../getCopyrightLine.js';

// Grunt task that determines created and last modified dates from git, and
// updates copyright statements accordingly, see #403
const repo = getRepo();


const unsupportedExtensions = [ '.json', 'md' ];

const filesPredicate = ( file: string ) => {
  if ( _.some( unsupportedExtensions, extension => file.endsWith( extension ) ) ) {
    return false;
  }
  if ( file.startsWith( 'js/' ) ) {
    return true;
  }
  return false;
};

/**
 * @param repo - The repository name for the files to update
 * @param predicate - takes a repo-relative path {string} and returns {boolean} if the path should be updated.
 */
async function updateCopyrightDates( repo: string, predicate = () => true ): Promise<void> {
  let relativeFiles: string[] = [];
  grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( `${subdir}/${filename}` );
  } );
  relativeFiles = relativeFiles.filter( filesPredicate ).filter( predicate );

  for ( const relativeFile of relativeFiles ) {
    await updateCopyrightDate( repo, relativeFile );
  }
}

/**
 * @param repo - The repository of the file to update (should be a git root)
 * @param relativeFile - The filename relative to the repository root.
 * @param silent - if true, no console logging will occur
 */
const updateCopyrightDate = async ( repo: string, relativeFile: string, silent = false ): Promise<void> => {
  const absPath = `../${repo}/${relativeFile}`;
  const fileText = fs.readFileSync( absPath, 'utf8' );

  // Infer the line separator for the platform
  const firstR = fileText.indexOf( '\r' );
  const firstN = fileText.indexOf( '\n' );
  const lineSeparator = firstR >= 0 && firstR < firstN ? '\r' : '\n';

  // Parse by line separator
  const fileLines = fileText.split( lineSeparator ); // splits using both unix and windows newlines

  // Check if the first line is already correct
  const firstLine = fileLines[ 0 ];
  const copyrightLine = await getCopyrightLine( repo, relativeFile );

  // Update the line
  if ( firstLine !== copyrightLine ) {
    if ( firstLine.startsWith( '// Copyright' ) ) {
      const concatted = [ copyrightLine ].concat( fileLines.slice( 1 ) );
      const newFileContents = concatted.join( lineSeparator );
      fs.writeFileSync( absPath, newFileContents );
      !silent && console.log( `${absPath}, updated with ${copyrightLine}` );
    }
    else {
      !silent && console.log( `${absPath} FIRST LINE WAS NOT COPYRIGHT: ${firstLine}` );
    }
  }
};

( async () => {
  await updateCopyrightDates( repo );
} )();