// Copyright 2016-2024, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
import fixEOL from '../../../perennial-alias/js/common/fixEOL.js';
const getTitleStringKey = require( './getTitleStringKey' );
import * as grunt from 'grunt';

/**
 * @returns - the html string, filled in from the template.
 */
module.exports = function( repo: string ): string {

  let html = grunt.file.read( '../chipper/templates/sim-a11y-view.html' ); // the template file

  const englishStringsString = grunt.file.read( `../${repo}/${repo}-strings_en.json` ); // the english strings file
  const englishStringsJSON = JSON.parse( englishStringsString );
  const englishSimTitle = englishStringsJSON[ getTitleStringKey( repo ).split( '/' )[ 1 ] ].value;

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_TITLE}}', englishSimTitle );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_SIM_URL}}', `${repo}_${ChipperConstants.FALLBACK_LOCALE}.html` );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_REPOSITORY}}', repo );

  // Remove to-dos so they don't propagate to all repo copies
  html = html.replace( /^.*\/\/[\s]?TODO.*\r?\n/mg, '' );

  return fixEOL( html );
};