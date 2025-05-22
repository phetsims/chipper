// Copyright 2017-2025, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into one HTML file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
import assert from 'assert';
import fs from 'fs';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import { StringMap } from './getStringMap.js';
import getTitleStringKey from './getTitleStringKey.js';

const pako = require( 'pako' );
const nodeHtmlEncoder = require( 'node-html-encoder' );

type PackageRunnableOptions = {
  repo: string;
  stringMap: StringMap;
  licenseScript: string;
  scripts: string[];
  locale: string;
  htmlHeader: string;
  compressScripts?: boolean;
};

const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf-8' ) );

/**
 * From a given set of config (including the JS and other required things), it creates an HTML file for a runnable.
 */
export default function packageRunnable( config: PackageRunnableOptions ): string {

  const encoder = new nodeHtmlEncoder.Encoder( 'entity' );

  const {
    repo, // {string}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    licenseScript, // {string}
    scripts, // {Array.<string>}
    locale, // {string}
    htmlHeader, // {string}
    compressScripts = false
  } = config;
  assert( stringMap, 'Requires stringMap' );
  assert( scripts, 'Requires scripts' );
  assert( licenseScript, 'Requires license script' );

  const localizedTitle = stringMap[ locale ][ getTitleStringKey( repo ) ];

  // Directory on the PhET website where the latest version of the sim lives
  const latestDir = `https://phet.colorado.edu/sims/html/${repo}/latest/`;

  // Converts a Uint8Array to a base64-encoded string (the usual String.fromCharCode.apply trick doesn't work for large arrays)
  const encodeBytes = ( uint8Array: Uint8Array ) => {
    let binary = '';
    const len = uint8Array.byteLength;
    for ( let i = 0; i < len; i++ ) {
      binary += String.fromCharCode( uint8Array[ i ] );
    }
    return btoa( binary );
  };

  // Converts from a JS string to a base64-encoded string
  const toEncodedString = ( string: string ) => encodeBytes( pako.deflate( string ) );

  // Converts from a JS string to a compressed JS string that can be run
  const toRunString = ( string: string ) => `_C('${toEncodedString( string )}')`;

  let scriptSection;
  if ( compressScripts ) {
    scriptSection = `<script>\n${licenseScript}\n</script>` +
                    `<script>${fs.readFileSync( '../sherpa/lib/pako_inflate-2.0.3.min.js', 'utf-8' )}</script>\n` +
                    '<script>let _R=q=>{var s=document.createElement("script");s.type=\'text/javascript\';s.async=false;var c=document.createTextNode(q);s.appendChild(c);document.body.appendChild(s);};let _D=s=>{const ar=new Uint8Array(s.length);for (let i=0;i<s.length;i++){ar[i]=s.charCodeAt(i);}return ar;};let _F=s=>pako.inflate(_D(atob(s)),{to:\'string\'});let _C=string=>_R(_F(string));' +
                    scripts.map( script => `${toRunString( script )}` ).join( '\n' ) + '</script>';
  }
  else {
    scriptSection = [ licenseScript, ...scripts ].map( script => `<script>${script}</script>` ).join( '\n' );
  }

  const bcp47Lang = localeData[ locale ].bcp47;
  assert( bcp47Lang, 'Requires bcp47 language' );

  return ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/sim.html' ), {
    PHET_CARRIAGE_RETURN: '\r',
    PHET_SIM_TITLE: encoder.htmlEncode( localizedTitle ),
    PHET_HTML_HEADER: htmlHeader,

    // Provide an initial value for the HTML lang attribute, see https://github.com/phetsims/chipper/issues/1332
    // The actual value may be changed on startup (e.g. if a locale query parameter is provided, or locale is
    // dynamically changed.
    PHET_LANG: bcp47Lang,

    // wrap scripts in global check for IE
    PHET_SIM_SCRIPTS: scriptSection,

    // metadata for Open Graph protocol, see phet-edmodo#2
    OG_TITLE: encoder.htmlEncode( localizedTitle ),
    OG_URL: `${latestDir}${repo}_${locale}.html`,
    OG_IMAGE: `${latestDir}${repo}-600.png`
  } );
}