// Copyright 2017, University of Colorado Boulder

/**
 * Gets the list of sims in a specified file in `chipper/data`.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * @param {Object} grunt - the grunt instance
 * @param {string} filename - the name of the data file
 * @returns {Array.<string>} - the list of sims from the file
 */

/* eslint-env node */
'use strict';

module.exports = function( grunt, filename ) {
  const contents = grunt.file.read( `../chipper/data/${filename}` ).trim();

  // Trim will remove any spaces and carriage returns if they are present.
  return contents.split( '\n' ).map( sim => sim.trim() );
};