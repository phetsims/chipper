// Copyright 2015-2024, University of Colorado Boulder

/**
 * Grunt task that determines created and last modified dates from git, and updates copyright statements accordingly,
 * see #403
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
import updateCopyrightDate from './updateCopyrightDate';

/**
 * @param repo - The repository name for the files to update
 * @param predicate - takes a repo-relative path {string} and returns {boolean} if the path should be updated.
 */
export default async function( repo: string, predicate = () => true ): Promise<void> {
  let relativeFiles: string[] = [];
  grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( `${subdir}/${filename}` );
  } );
  relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ).filter( predicate );

  for ( const relativeFile of relativeFiles ) {
    await updateCopyrightDate( repo, relativeFile );
  }
}