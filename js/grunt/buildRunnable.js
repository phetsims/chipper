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
const buildMipmaps = require( './buildMipmaps' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const copySupplementalPhETIOFiles = require( './phet-io/copySupplementalPhETIOFiles' );
const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate' );
const getAllThirdPartyEntries = require( './getAllThirdPartyEntries' );
const getDependencies = require( './getDependencies' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getPhetLibs = require( './getPhetLibs' );
const getPreloads = require( './getPreloads' );
const getStringMap = require( './getStringMap' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );
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
 * @param {string} repo
 * @param {boolean} uglify - Whether to uglify or not
 * @param {boolean} mangle - If uglifying, whether to mangle variable names
 * @param {boolean} instrument - If the sim should be instrumented
 * @param {boolean} allHTML - If the _all.html file should be generated
 * @param {boolean} debugHTML - If the _debug.html file should be generated
 * @param {string} brand
 * @param {string} localesOption - e.g,. '*', 'en,es', etc.
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function( repo, uglify, mangle, instrument, allHTML, debugHTML, brand, localesOption ) {
  // TODO: too many parameters. use options pattern instead.
  assert( typeof repo === 'string' );
  assert( typeof uglify === 'boolean' );
  assert( typeof mangle === 'boolean' );
  assert( _.includes( ChipperConstants.BRANDS, brand ), 'Unknown brand in buildRunnable: ' + brand );

  if ( brand === 'phet-io' ) {
    assert( grunt.file.exists( '../phet-io' ), 'Aborting the build of phet-io brand since proprietary repositories are not checked out.\nPlease use --brands=={{BRAND}} in the future to avoid this.' );
  }

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  const encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  // All html files share the same build timestamp
  let timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  const requireJS = await requireBuild( repo, `../${repo}/js/${repo}-config.js`, {
    insertRequire: repo + '-main',
    brand
  } );
  const productionJS = uglify ? minify( requireJS, { mangle, babelTranspile: true } ) : requireJS;

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( packageObject.phet.requirejsNamespace );

  // After all strings have been loaded, report which of the translatable strings are unused.
  reportUnusedStrings( repo, packageObject.phet.requirejsNamespace );


  const rawPreloads = getPreloads( repo, brand ).map( filename => grunt.file.read( filename ) );
  const productionPreloads = rawPreloads.map( js => uglify ? minify( js, { mangle } ) : js );

  const phetLibs = getPhetLibs( repo, brand );
  const allLocales = [ ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository( repo ) ];
  const locales = localesOption === '*' ? allLocales : localesOption.split( ',' );
  const dependencies = await getDependencies( repo );
  const version = packageObject.version; // Include the one-off name in the version
  const thirdPartyEntries = getAllThirdPartyEntries( repo, brand );
  const stringMap = getStringMap( allLocales, phetLibs );
  const mipmapsJavaScript = await buildMipmaps();

  grunt.log.ok( `Minification for ${brand} complete` );
  grunt.log.ok( `Require.js: ${productionJS.length} bytes` );
  grunt.log.ok( `Preloads: ${_.sum( productionPreloads.map( preload => preload.length ) )} bytes` );
  grunt.log.ok( `Mipmaps: ${mipmapsJavaScript.length} bytes` );

  const commonOptions = {
    brand,
    repo,
    stringMap,
    mipmapsJavaScript,
    dependencies,
    timestamp,
    version,
    thirdPartyEntries
  };

  // Create the build-specific directory
  const buildDir = `../${repo}/build/${brand}`;
  grunt.file.mkdir( buildDir );

  // {{locale}}.html
  if ( brand !== 'phet-io' ) {
    for ( let locale of locales ) {
      grunt.file.write( `${buildDir}/${repo}_${locale}_${brand}.html`, packageRunnable( _.extend( {
        locale,
        includeAllLocales: false,
        isDebugBuild: false,
        mainInlineJavascript: productionJS,
        preloadScripts: productionPreloads
      }, commonOptions ) ) );
    }
  }

  // _all.html (forced for phet-io)
  if ( allHTML || brand === 'phet-io' ) {
    grunt.file.write( `${buildDir}/${repo}_all_${brand}.html`, packageRunnable( _.extend( {
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: false,
      mainInlineJavascript: productionJS,
      preloadScripts: productionPreloads
    }, commonOptions ) ) );
  }

  if ( debugHTML ) {
    const debugJS = brand === 'phet-io' ? minify( requireJS, {
      mangle: true,
      babelTranspile: true,
      stripAssertions: false,
      stripLogging: false
    } ) : requireJS;
    const debugPreloads = rawPreloads.map( js => brand === 'phet-io' ? minify( js, { mangle: true } ) : js );
    grunt.file.write( `${buildDir}/${repo}_all_${brand}_debug.html`, packageRunnable( _.extend( {
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: true,
      mainInlineJavascript: debugJS,
      preloadScripts: debugPreloads
    }, commonOptions ) ) );
  }

  // dependencies.json
  grunt.file.write( `${buildDir}/dependencies.json`, JSON.stringify( dependencies, null, 2 ) );

  // -iframe.html (English is assumed as the locale).
  if ( _.includes( locales, ChipperConstants.FALLBACK_LOCALE ) && brand === 'phet' ) {
    const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ getTitleStringKey( repo ) ];

    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    let iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( englishTitle + ' iframe test' ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_REPOSITORY}}', repo );

    let iframeLocales = [ 'en' ].concat( allHTML ? [ 'all' ] : [] );
    iframeLocales.forEach( locale => {
      const iframeHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_LOCALE}}', locale );
      grunt.file.write( `${buildDir}/${repo}_${locale}_iframe_phet.html`, iframeHtml );
    } );
  }

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if ( packageObject.phet.accessible && brand === 'phet' ) {
    // (a11y) Create the a11y-view HTML file for pDOM viewing.
    let a11yHTML = getA11yViewHTMLFromTemplate( repo );
    a11yHTML = ChipperStringUtils.replaceFirst( a11yHTML, '{{PHET_REPOSITORY}}', repo );

    grunt.file.write( `${buildDir}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML );
  }

  if ( brand === 'phet-io' ) {
    await copySupplementalPhETIOFiles( repo, version );
  }

  // Thumbnails and twitter card
  if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
    const thumbnailSizes = [
      { width: 128, height: 84 },
      { width: 600, height: 394 }
    ];
    for ( let size of thumbnailSizes ) {
      grunt.file.write( `${buildDir}/${repo}-${size.width}.png`, await generateThumbnails( repo, size.width, size.height ) );
    }

    if ( brand === 'phet' ) {
      grunt.file.write( `${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard( repo ) );
    }
  }
};
