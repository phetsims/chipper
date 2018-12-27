// Copyright 2015, University of Colorado Boulder

/**
 * Grunt task that determines created and last modified dates from git, and updates copyright statements accordingly,
 * see #403
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const grunt = require( 'grunt' );
const updateCopyrightDate = require( './updateCopyrightDate' );

/**
 * @public
 * @param {string} repo - The repository name for the files to update
 * @param {function} predicate - takes a repo-relative path {string} and returns {boolean} if the path should be updated.
 * @returns {Promise}
 */
module.exports = async function( repo, predicate = () => true ) {
  let relativeFiles = [];
  grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( `${subdir}/${filename}` );
  } );
  relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ).filter( predicate );

  for ( const relativeFile of relativeFiles ) {
    await updateCopyrightDate( repo, relativeFile );
  }
};
