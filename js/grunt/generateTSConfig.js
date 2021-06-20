// Copyright 2015-2021, University of Colorado Boulder

/**
 * Generates the tsconfig.json file for typescript compilation.
 *
 * See https://github.com/phetsims/chipper/issues/63
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

// modules
const fixEOL = require( './fixEOL' );
const grunt = require( 'grunt' );

/**
 * @param {string} repo
 *
 * @returns {Promise}
 */
module.exports = async function( repo ) {

  const string = `{
  "extends": "../chipper/tsconfig-core.json",
  "references": [
    {
      "path": "../chipper/tsconfig/joist"
    }
  ],
  "include": [
    "js/**/*",
    "images/**/*",
    "sounds/**/*",
    "mipmaps/**/*"
  ],
  "exclude": [
    "node_modules",
    "build"
  ]
}`;

  const outputFile = `../${repo}/tsconfig.json`;

  // Write to the repository's root directory.
  grunt.file.write( outputFile, fixEOL( string ) );
};