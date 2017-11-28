// Copyright 2017, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var ChipperConstants = require( '../common/ChipperConstants' );
var ChipperStringUtils = require( '../common/ChipperStringUtils' );
var getTitleStringKey = require( './getTitleStringKey' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {string} repo
 * @returns {string} - the html string, filled in from the template.
 */
module.exports = function( grunt, repo ) {

  var html = grunt.file.read( '../chipper/templates/sim-a11y-view.html' ); // the template file

  // TODO: improved way of just grabbing the title
  var englishStringsString = grunt.file.read( `../${repo}/${repo}-strings_en.json` ); // the english strings file
  var englishStringsJSON = JSON.parse( englishStringsString );
  var englishSimTitle = englishStringsJSON[ getTitleStringKey( grunt, repo ).split( '/' )[ 1 ] ].value;

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', englishSimTitle );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', `${repo}_${ChipperConstants.FALLBACK_LOCALE}.html` );

  return html;
};
