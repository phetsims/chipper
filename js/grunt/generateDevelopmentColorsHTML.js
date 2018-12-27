// Copyright 2015, University of Colorado Boulder

/**
 * Generates the top-level simName-colors.html file for simulations (or runnables) that provides a color-picker
 * interface for the sim's color profiles.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const grunt = require( 'grunt' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {string} repo
 */
module.exports = function( repo ) {
  let html = grunt.file.read( '../chipper/templates/sim-development-colors.html' ); // the template file

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', `${repo} colors` );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', `${repo}_${ChipperConstants.FALLBACK_LOCALE}.html` );

  // Write to the repository's root directory.
  grunt.file.write( `../${repo}/${repo}-colors.html`, html );
};
