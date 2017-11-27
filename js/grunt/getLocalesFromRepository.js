// Copyright 2017, University of Colorado Boulder

/**
 * TODO doc
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

/*
 * Gets the locales from a repository, by inspecting the names of the string files in babel for that repository.
 * @public
 *
 * @param {Object} grunt
 * @param {string} repository - name of the repository to get locales from
 */
module.exports = function( grunt, repository ) {

  // confirm that the repository has a strings directory
  var stringsDirectory = '../babel/' + repository;
  assert( grunt.file.isDir(), stringsDirectory + 'is not a directory' );

  // Get names of string files.
  var stringFiles = grunt.file.expand( stringsDirectory + '/' + repository + '-strings_*.json' );

  // Don't fail out if there are no string files, as this is a normal condition when building new simulations
  if ( stringFiles.length === 0 ) {
    grunt.log.debug( 'No string files found in ' + stringsDirectory + ' for repository ' + repository );
    return [];
  }

  // Extract the locales from the file names.
  // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
  var locales = stringFiles.map( function( filename ) {
    return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
  } );
  assert( locales.length > 0, 'no locales found in ' + stringsDirectory );

  return locales;
};
