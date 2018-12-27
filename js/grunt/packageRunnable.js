// Copyright 2017, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into one HTML file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const assert = require( 'assert' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );
const nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match

/**
 * From a given set of config (including the JS and other required things), it creates an HTML file for a runnable.
 * @public
 *
 * @param {Object} config
 * @returns {string} - The HTML for the file.
 */
module.exports = function( config ) {

  const encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  const {
    repo, // {string}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    scripts, // {Array.<string>}
    locale, // {string}
    htmlHeader // {string}
  } = config;
  assert( typeof repo === 'string', 'Requires repo' );
  assert( stringMap, 'Requires stringMap' );
  assert( scripts, 'Requires scripts' );
  assert( typeof locale === 'string', 'Requires locale' );
  assert( typeof htmlHeader === 'string', 'Requires htmlHeader' );

  const localizedTitle = stringMap[ locale ][ getTitleStringKey( repo ) ];

  // Directory on the PhET website where the latest version of the sim lives
  const latestDir = `https://phet.colorado.edu/sims/html/${repo}/latest/`;

  return ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/sim.html' ), {
    PHET_CARRIAGE_RETURN: '\r',
    PHET_SIM_TITLE: encoder.htmlEncode( localizedTitle ),
    PHET_HTML_HEADER: htmlHeader,
    PHET_SIM_SCRIPTS: scripts.map( script => `<script type="text/javascript">${script}</script>` ).join( '\n' ),

    // metadata for Open Graph protocol, see phet-edmodo#2
    OG_TITLE: encoder.htmlEncode( localizedTitle ),
    OG_URL: `${latestDir}${repo}_${locale}.html`,
    OG_IMAGE: `${latestDir}${repo}-600.png`
  } );
};
