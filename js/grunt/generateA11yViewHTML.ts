// Copyright 2016-2024, University of Colorado Boulder

/**
 * Generates the top-level simName-accessibility-view.html file for simulations (or runnables). Lets one
 * see the accessible content by placing the sim in an iframe and running an up to date copy of the parallel
 * DOM next to it.
 *
 * @author Jesse Greenberg
 */

// modules
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate' );
const writeFileAndGitAdd = require( '../../../perennial-alias/js/common/writeFileAndGitAdd' );

// TODO: Do we really want to use import *? What is a better way, see https://github.com/phetsims/chipper/issues/1451
// TODO: This will be fixed when we export default, see https://github.com/phetsims/chipper/issues/1451
import * as ChipperConstants from '../common/ChipperConstants.js';
import * as ChipperStringUtils from '../common/ChipperStringUtils.js';

module.exports = async function( repo: string ) {

  let html = getA11yViewHTMLFromTemplate( repo );
  html = ChipperStringUtils.replaceFirst( html, '{{PHET_REPOSITORY}}', repo );

  // Write to the repository's root directory.
  await writeFileAndGitAdd( repo, `${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, html );
};