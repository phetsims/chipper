// Copyright 2018-2026, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into an XHTML structure (with separate files)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

// modules
import assert from 'assert';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import ChipperConstants from '../common/ChipperConstants.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getTitleStringKey from './getTitleStringKey.js';

const nodeHtmlEncoder = require( 'node-html-encoder' );

/**
 * From a given set of config (including the JS and other required things), it creates an XHTML structure and writes it to disk.
 */
export default function packageXHTML( xhtmlDir: string, config: IntentionalAny ): void {
  const encoder = new nodeHtmlEncoder.Encoder( 'entity' );

  const {
    repo, // {string}
    brand, // {string}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    initializationScript, // {string} - separate from the rest of the scripts since it needs to be able to run in IE.
    licenseScript, // {string}
    scripts, // {Array.<string>}
    htmlHeader // {string}
  } = config;
  assert( stringMap, 'Requires stringMap' );
  assert( scripts, 'Requires scripts' );

  const localizedTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ getTitleStringKey( repo ) ];

  const licenseScriptFilename = `${repo}_license_${brand}.js`;
  const initializationScriptFilename = `${repo}_initialization_${brand}.js`;

  const script = scripts.join( '\n' );
  const scriptFilename = `${repo}_${brand}.js`;

  const xhtml = ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/sim.xhtml' ), {
    PHET_SIM_TITLE: encoder.htmlEncode( localizedTitle ),
    PHET_HTML_HEADER: htmlHeader,
    PHET_INITIALIZATION_SCRIPT: `<script type="text/javascript" src="${licenseScriptFilename}" charset="utf-8"></script><script type="text/javascript" src="${initializationScriptFilename}" charset="utf-8"></script>`,
    PHET_SIM_SCRIPTS: `<script type="text/javascript" src="${scriptFilename}" charset="utf-8"></script>`
  } );
  grunt.file.write( `${xhtmlDir}/${repo}_all${brand === 'phet' ? '' : `_${brand}`}.xhtml`, xhtml );
  grunt.file.write( `${xhtmlDir}/${licenseScriptFilename}`, licenseScript );
  grunt.file.write( `${xhtmlDir}/${initializationScriptFilename}`, initializationScript );
  grunt.file.write( `${xhtmlDir}/${scriptFilename}`, script );
}