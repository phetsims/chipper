// Copyright 2017, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );

/**
 * @param {string} repo
 * @param {string} englishSimTitle
 * @returns {string} - the html string, filled in from the template.
 */
module.exports = function( repo, englishSimTitle ) {

  let html = grunt.file.read( '../chipper/templates/sim-a11y-view.html' ); // the template file

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', englishSimTitle );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', `${repo}_${ChipperConstants.FALLBACK_LOCALE}.html` );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_REPOSITORY}}', repo );

  return html;
};
