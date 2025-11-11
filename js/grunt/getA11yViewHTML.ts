// Copyright 2016-2025, University of Colorado Boulder

/**
 * From the a11y view template file, fill in the templated values and return the html as a string.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @returns - the html string, filled in from the template.
 */

import fixEOL from '../../../perennial-alias/js/common/fixEOL.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';

export default function getA11yViewHTML( repo: string ): string {

  let html = grunt.file.read( '../chipper/wrappers/a11y-view/index.html' ); // the template file is also runnable

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{PHET_REPOSITORY}}', repo );

  // Remove to-dos so they don't propagate to all repo copies
  html = html.replace( /^.*\/\/[\s]?TODO.*\r?\n/mg, '' );

  return fixEOL( html );
}