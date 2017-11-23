// Copyright 2017, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 * @returns {string} - the html string, filled in from the template.
 */
module.exports = function( grunt, buildConfig ) {

  var repositoryName = buildConfig.name;
  var html = grunt.file.read( '../chipper/templates/sim-a11y-view.html' ); // the template file

  var englishStringsString = grunt.file.read( repositoryName + '-strings_en.json' ); // the english strings file
  var englishStringsJSON = JSON.parse( englishStringsString );
  var englishSimTitle = englishStringsJSON[ buildConfig.simTitleStringKey.split( '/' )[ 1 ] ].value;

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', englishSimTitle );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', buildConfig.name + '_' + ChipperConstants.FALLBACK_LOCALE + '.html' );

  return html;
};
