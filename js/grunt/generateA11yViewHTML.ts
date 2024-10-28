// Copyright 2016-2024, University of Colorado Boulder

/**
 * Generates the top-level simName-accessibility-view.html file for simulations (or runnables). Lets one
 * see the accessible content by placing the sim in an iframe and running an up to date copy of the parallel
 * DOM next to it.
 *
 * @author Jesse Greenberg
 */

// modules
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate.js' );
const writeFileAndGitAdd = require( '../../../perennial-alias/js/common/writeFileAndGitAdd.js' );

import ChipperConstants from '../common/ChipperConstants.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';

module.exports = async function( repo: string ) {

  let html = getA11yViewHTMLFromTemplate( repo );
  html = ChipperStringUtils.replaceFirst( html, '{{PHET_REPOSITORY}}', repo );

  // Write to the repository's root directory.
  await writeFileAndGitAdd( repo, `${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, html );
};