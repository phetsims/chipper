// Copyright 2015, University of Colorado Boulder

/**
 * Find code duplicates in the paths that are linted.  Usage:
 *
 * // To find duplicates in the repo itself
 * grunt find-duplicates
 *
 * // To find duplicates in the repo and its dependencies
 * grunt find-duplicates --all
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */
module.exports = function( grunt, gruntConfig ) {
  'use strict';

  // Load the jscpd code duplicate finder
  var jscpd = require( 'jscpd' );

  // Choose the paths to check for duplicates
  // If the user specified --all, then lint the repo and its dependencies
  var paths = grunt.option( 'all' ) ? gruntConfig.eslint.allFiles : gruntConfig.eslint.repoFiles;

  // For compatibility with jscpd, if there is only one entry, it should be a string (for glob)
  var files = paths.length === 1 ? paths[ 0 ] : paths;
  jscpd.prototype.run( {

    // Paths are relative
    path: '.',

    // The files to check
    files: files,

    // Files are specified above, excludes are already addressed there
    exclude: [],

    // stores results as json instead of xml
    reporter: 'json',

    // Print the results to the screen
    verbose: true
  } );
};