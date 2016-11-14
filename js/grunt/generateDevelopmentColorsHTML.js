// Copyright 2015, University of Colorado Boulder

/**
 * Generates the top-level simName-colors.html file for simulations (or runnables) that provides a color-picker
 * interface for the sim's color profiles.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var repositoryName = buildConfig.name;
  var html = grunt.file.read( '../chipper/templates/sim-development-colors.html' ); // the template file

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', buildConfig.name + ' colors' );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', buildConfig.name + '_' + ChipperConstants.FALLBACK_LOCALE + '.html' );

  // Write to the repository's root directory.
  grunt.file.write( repositoryName + '-colors.html', html );
};
