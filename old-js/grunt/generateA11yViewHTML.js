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
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var getA11yViewHTMLFromTemplate = require( '../../../chipper/js/grunt/getA11yViewHTMLFromTemplate' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {

  var html = getA11yViewHTMLFromTemplate( grunt, buildConfig );

  var repositoryName = buildConfig.name;

  // Write to the repository's root directory.
  grunt.file.write( repositoryName + ChipperConstants.A11Y_VIEW_HTML_SUFFIX, html );
};
