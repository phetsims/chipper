// Copyright 2017-2025, University of Colorado Boulder

/**
 * Gets the locales from a repository, by inspecting the names of the string files in babel for that repository.
 *
 * @param repo - name of the repository to get locales from
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';

export default function getLocalesFromRepository( repo: string ): string[] {

  // confirm that the repository has a strings directory
  const stringsDirectory = `../babel/${repo}`;

  // Get names of string files.
  const stringFiles: string[] = grunt.file.expand( `${stringsDirectory}/${repo}-strings_*.json` );

  // Don't fail out if there are no string files, as this is a normal condition when building new simulations
  if ( stringFiles.length === 0 ) {
    grunt.log.verbose.writeln( `No string files found in ${stringsDirectory} for repository ${repo}` );
    return [];
  }

  // Extract the locales from the file names.
  // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
  const locales = stringFiles.map( filename => {
    return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
  } );
  assert( locales.length > 0, `no locales found in ${stringsDirectory}` );

  return locales;
}