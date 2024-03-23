// Copyright 2018-2024, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into an XHTML structure (with separate files)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


// modules
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );
const nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match

/**
 * From a given set of config (including the JS and other required things), it creates an XHTML structure.
 * @public
 *
 * @param {string} xhtmlDir
 * @param {Object} config
 * @returns {string} - The HTML for the file.
 */
module.exports = function( xhtmlDir, config ) {
  const encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  const {
    repo, // {string}
    brand, // {string}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    initializationScript, // {string} - separate from the rest of the scripts since it needs to be able to run in IE.
    licenseScript, // {string}
    scripts, // {Array.<string>}
    htmlHeader // {string}
  } = config;
  assert( typeof repo === 'string', 'Requires repo' );
  assert( stringMap, 'Requires stringMap' );
  assert( scripts, 'Requires scripts' );
  assert( typeof htmlHeader === 'string', 'Requires htmlHeader' );

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
};