// Copyright 2017, University of Colorado Boulder

/**
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const assert = require( 'assert' );
const grunt = require( 'grunt' );

/*
 * Gets the locales from a repository, by inspecting the names of the string files in babel for that repository.
 * @public
 *
 * @param {string} repo - name of the repository to get locales from
 */
module.exports = function( repo ) {

  // confirm that the repository has a strings directory
  const stringsDirectory = `../babel/${repo}`;
  assert( grunt.file.isDir(), `${stringsDirectory} is not a directory` );

  // Get names of string files.
  const stringFiles = grunt.file.expand( `${stringsDirectory}/${repo}-strings_*.json` );

  // Don't fail out if there are no string files, as this is a normal condition when building new simulations
  if ( stringFiles.length === 0 ) {
    grunt.log.debug( `No string files found in ${stringsDirectory} for repository ${repo}` );
    return [];
  }

  // Extract the locales from the file names.
  // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
  const locales = stringFiles.map( function( filename ) {
    return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
  } );
  assert( locales.length > 0, `no locales found in ${stringsDirectory}` );

  return locales;
};
