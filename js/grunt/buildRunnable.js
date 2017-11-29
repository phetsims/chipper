// Copyright 2017, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const brandToSuffix = require( './brandToSuffix' );
const buildMipmaps = require( './buildMipmaps' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const copySupplementalPhETIOFiles = require( './phet-io/copySupplementalPhETIOFiles' );
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate' );
const getAllThirdPartyEntries = require( './getAllThirdPartyEntries' );
const getDependencies = require( './getDependencies' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getLocalesToBuild = require( './getLocalesToBuild' );
const getPhetLibs = require( './getPhetLibs' );
const getPreloads = require( './getPreloads' );
const getSimsFromDataFile = require( './getSimsFromDataFile' );
const getStringMap = require( './getStringMap' );
const getTitleStringKey = require( './getTitleStringKey' );
const getVersionForBrand = require( '../getVersionForBrand' );
const minify = require( './minify' );
const nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match
const packageRunnable = require( './packageRunnable' );
const requireBuild = require( './requireBuild' );
const reportUnusedMedia = require( './reportUnusedMedia' );
const reportUnusedStrings = require( './reportUnusedStrings' );

/**
 * Builds a runnable (e.g. a simulation).
 * @public
 *
 * @param {Object} grunt
 * @param {string} repo
 * @param {boolean} uglify - Whether to uglify or not
 * @param {boolean} mangle - If uglifying, whether to mangle variable names
 * @param {boolean} instrument - If the sim should be instrumented
 * @param {boolean} allHTML - If the _all.html file should be generated
 * @param {string} brand
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function( grunt, repo, uglify, mangle, instrument, allHTML, brand ) {
  // TODO: too many parameters. use options pattern instead.
  assert( typeof repo === 'string' );
  assert( typeof uglify === 'boolean' );
  assert( typeof mangle === 'boolean' );
  assert( _.includes( ChipperConstants.BRANDS, brand ), 'Unknown brand in buildRunnable: ' + brand );

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  var encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  // All html files share the same build timestamp
  var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  var requireJS = await requireBuild( grunt, repo, `../${repo}/js/${repo}-config.js`, { insertRequire: repo + '-main', brand } );

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, packageObject.phet.requirejsNamespace );

  // After all strings have been loaded, report which of the translatable strings are unused.
  reportUnusedStrings( grunt, repo, packageObject.phet.requirejsNamespace );

  if ( uglify ) {
    requireJS = minify( grunt, requireJS, { mangle, babelTranspile: true } );
  }

  const preloads = getPreloads( grunt, repo, brand ).map( filename => {
    var js = grunt.file.read( filename );

    if ( uglify ) {
      js = minify( grunt, js, { mangle } );
    }

    return js;
  } );

  const phetLibs = getPhetLibs( grunt, repo, brand );
  const allLocales = [ ChipperConstants.FALLBACK_LOCALE ].concat( getLocalesFromRepository( grunt, repo ) );
  const locales = getLocalesToBuild( grunt, repo );
  const dependencies = await getDependencies( grunt, repo );
  const version = getVersionForBrand( brand, packageObject.version );
  const thirdPartyEntries = getAllThirdPartyEntries( grunt, repo, brand );
  const stringMap = getStringMap( grunt, allLocales, phetLibs );

  const commonOptions = {
    brand,
    repo,
    stringMap,
    mainInlineJavascript: requireJS,
    preloadScripts: preloads,
    mipmapsJavaScript: await buildMipmaps( grunt ),
    dependencies,
    timestamp,
    version,
    thirdPartyEntries
  };
  
  // TODO: how to handle one-offs? Add another suffix presumably.
  const brandSuffix = brandToSuffix( grunt, brand );

  // {{locale}}.html
  for ( let locale of locales ) {
    grunt.file.write( `../${repo}/build/${repo}_${locale}${brandSuffix}.html`, packageRunnable( grunt, _.extend( {
      locale,
      includeAllLocales: false
    }, commonOptions ) ) );
  }

  // _all.html
  if ( allHTML ) {
    grunt.file.write( `../${repo}/build/${repo}_all${brandSuffix}.html`, packageRunnable( grunt, _.extend( {
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true
    }, commonOptions ) ) );
  }

  // TODO: debug build here

  // dependencies.json
  grunt.file.write( `../${repo}/build/dependencies.json`, JSON.stringify( dependencies, null, 2 ) );

  // -iframe.html (English is assumed as the locale).
  if ( _.includes( locales, ChipperConstants.FALLBACK_LOCALE ) && brand === 'phet' ) {
    const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ getTitleStringKey( grunt, repo ) ];

    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    var iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( englishTitle + ' iframe test' ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_URL}}', repo + '_' + ChipperConstants.FALLBACK_LOCALE + '.html' );
    grunt.file.write( `../${repo}/build/${repo}_${ChipperConstants.FALLBACK_LOCALE}-iframe.html`, iframeTestHtml );
  }

  var a11ySims = getSimsFromDataFile( grunt, 'accessibility' );

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if ( a11ySims.indexOf( repo ) >= 0 && brand === 'phet' ) {
    // (a11y) Create the a11y-view HTML file for pDOM viewing.
    var a11yHTML = getA11yViewHTMLFromTemplate( grunt, repo );
    grunt.file.write( `../${repo}/build/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML );
  }

  if ( brand === 'phet-io' ) {
    await copySupplementalPhETIOFiles( grunt, repo, version );
  }
};
