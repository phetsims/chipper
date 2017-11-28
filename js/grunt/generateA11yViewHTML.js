// Copyright 2017, University of Colorado Boulder

/**
 * Generates the top-level simName-accessibility-view.html file for simulations (or runnables). Lets one
 * see the accessible content by placing the sim in an iFrame and running an up to date copy of the parallel
 * DOM next to it.
 *
 * @author Jesse Greenberg
 */
/* eslint-env node */
'use strict';

// modules
const ChipperConstants = require( '../common/ChipperConstants' );
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {string} repo
 */
module.exports = function( grunt, repo ) {

  const html = getA11yViewHTMLFromTemplate( grunt, repo );

  // Write to the repository's root directory.
  grunt.file.write( `../${repo}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, html );
};
