// Copyright 2017-2020, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const copyDirectory = require( './copyDirectory' );
const copySupplementalPhetioFiles = require( './phet-io/copySupplementalPhetioFiles' );
const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const getA11yViewHTMLFromTemplate = require( './getA11yViewHTMLFromTemplate' );
const getAllThirdPartyEntries = require( './getAllThirdPartyEntries' );
const getDependencies = require( './getDependencies' );
const getInitializationScript = require( './getInitializationScript' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getPhetLibs = require( './getPhetLibs' );
const getPreloads = require( './getPreloads' );
const getStringMap = require( './getStringMap' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );
const jimp = require( 'jimp' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );
const minify = require( './minify' );
const nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match
const packageRunnable = require( './packageRunnable' );
const packageXHTML = require( './packageXHTML' );
const reportUnusedStrings = require( './reportUnusedStrings' );
const webpackBuild = require( './webpackBuild' );
const zlib = require( 'zlib' );

// TODO: Re-enable these? https://github.com/phetsims/chipper/issues/909
// const reportUnusedMedia = require( './reportUnusedMedia' );

const recordTime = async ( asyncCallback, timeCallback ) => {
  const beforeTime = Date.now();
  const result = await asyncCallback();
  const afterTime = Date.now();
  timeCallback( afterTime - beforeTime, result );
  return result;
};

/**
 * Builds a runnable (e.g. a simulation).
 * @public
 *
 * @param {string} repo
 * @param {Object} minifyOptions - see minify.js
 * @param {boolean} instrument - If the sim should be instrumented
 * @param {boolean} allHTML - If the _all.html file should be generated
 * @param {string} brand
 * @param {string} localesOption - e.g,. '*', 'en,es', etc.
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function( repo, minifyOptions, instrument, allHTML, brand, localesOption, buildLocal ) {
  assert( typeof repo === 'string' );
  assert( typeof minifyOptions === 'object' );
  assert( _.includes( ChipperConstants.BRANDS, brand ), 'Unknown brand in buildRunnable: ' + brand );

  if ( brand === 'phet-io' ) {
    assert( grunt.file.exists( '../phet-io' ), 'Aborting the build of phet-io brand since proprietary repositories are not checked out.\nPlease use --brands=={{BRAND}} in the future to avoid this.' );
  }

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  // All html files share the same build timestamp
  let timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // Start running webpack
  const webpackResult = await recordTime( async () => {
    return await webpackBuild( repo, brand );
  }, time => {
    grunt.log.ok( `Webpack build complete: ${time}ms` );
  } );

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  const webpackJS = 'phet.chipper.runWebpack = function() {' + webpackResult.js + '};';

  // Debug version is independent of passed in minifyOptions.  PhET-iO brand is minified, but leaves assertions & logging.
  const debugMinifyOptions = brand === 'phet-io' ? {
    stripAssertions: false,
    stripLogging: false
  } : {
    minify: false
  };

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  // TODO: Re-enable this? https://github.com/phetsims/chipper/issues/909
  // reportUnusedMedia( packageObject.phet.requirejsNamespace );

  const phetLibs = getPhetLibs( repo, brand );
  const allLocales = [ ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository( repo ) ];
  const locales = localesOption === '*' ? allLocales : localesOption.split( ',' );
  const dependencies = await getDependencies( repo );
  const version = packageObject.version; // Include the one-off name in the version
  const thirdPartyEntries = getAllThirdPartyEntries( repo, brand );
  const simTitleStringKey = getTitleStringKey( repo );

  const stringMap = getStringMap( allLocales, phetLibs, webpackResult.usedModules );

  // After our string map is consturcted, report which of the translatable strings are unused.
  reportUnusedStrings( repo, packageObject.phet.requirejsNamespace, stringMap[ ChipperConstants.FALLBACK_LOCALE ] );

  // If we have NO strings for a given locale that we want, we'll need to fill it in with all English strings, see
  // https://github.com/phetsims/perennial/issues/83
  for ( const locale of locales ) {
    if ( !stringMap[ locale ] ) {
      stringMap[ locale ] = stringMap[ ChipperConstants.FALLBACK_LOCALE ];
    }
  }

  const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ simTitleStringKey ];
  assert( englishTitle, `missing entry for sim title, key = ${simTitleStringKey}` );

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  let htmlHeader;
  if ( brand === 'phet-io' ) {

    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = englishTitle + ' ' + version + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This Interoperable PhET Simulation file requires a license.\n' +
                 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                 'Contact phethelp@colorado.edu regarding licensing.\n' +
                 'https://phet.colorado.edu/en/licensing';
  }
  else {
    htmlHeader = englishTitle + ' ' + version + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This file is licensed under Creative Commons Attribution 4.0\n' +
                 'For alternate source code licensing, see https://github.com/phetsims\n' +
                 'For licenses for third-party software used by this simulation, see below\n' +
                 'For more information, see https://phet.colorado.edu/en/licensing/html\n' +
                 '\n' +
                 'The PhET name and PhET logo are registered trademarks of The Regents of the\n' +
                 'University of Colorado. Permission is granted to use the PhET name and PhET logo\n' +
                 'only for attribution purposes. Use of the PhET name and/or PhET logo for promotional,\n' +
                 'marketing, or advertising purposes requires a separate license agreement from the\n' +
                 'University of Colorado. Contact phethelp@colorado.edu regarding licensing.';
  }

  // Scripts that are run before our main minifiable content
  const startupScripts = [
    // Splash image
    `window.PHET_SPLASH_DATA_URI="${loadFileAsDataURI( `../brand/${brand}/images/splash.svg` )}";`
  ];

  const minifiableScripts = [
    // Preloads
    ...getPreloads( repo, brand, true ).map( filename => grunt.file.read( filename ) ),

    // Our main require.js content, wrapped in a function called in the startup below
    webpackJS,

    // Main startup
    grunt.file.read( '../chipper/templates/chipper-startup.js' )
  ];

  const productionScripts = await recordTime( async () => {
    return [
      ...startupScripts,
      ...minifiableScripts.map( js => minify( js, minifyOptions ) )
    ];
  }, ( time, scripts ) => {
    grunt.log.ok( `Production minification complete: ${time}ms (${_.sum( scripts.map( js => js.length ) )} bytes)` );
  } );
  const debugScripts = await recordTime( async () => {
    return [
      ...startupScripts,
      ...minifiableScripts.map( js => minify( js, debugMinifyOptions ) )
    ];
  }, ( time, scripts ) => {
    grunt.log.ok( `Debug minification complete: ${time}ms (${_.sum( scripts.map( js => js.length ) )} bytes)` );
  } );

  const commonInitializationOptions = {
    brand: brand,
    repo: repo,
    stringMap: stringMap,
    dependencies: dependencies,
    timestamp: timestamp,
    version: version,
    thirdPartyEntries: thirdPartyEntries,
    packageObject: packageObject
  };

  // Create the build-specific directory
  const buildDir = `../${repo}/build/${brand}`;
  grunt.file.mkdir( buildDir );

  // {{locale}}.html
  if ( brand !== 'phet-io' ) {
    for ( const locale of locales ) {
      const initializationScript = getInitializationScript( _.extend( {
        locale: locale,
        includeAllLocales: false,
        isDebugBuild: false
      }, commonInitializationOptions ) );
      grunt.file.write( `${buildDir}/${repo}_${locale}_${brand}.html`, packageRunnable( {
        repo: repo,
        stringMap: stringMap,
        htmlHeader: htmlHeader,
        locale: locale,
        scripts: [ initializationScript, ...productionScripts ]
      } ) );
    }
  }

  // _all.html (forced for phet-io)
  if ( allHTML || brand === 'phet-io' ) {
    const initializationScript = getInitializationScript( _.extend( {
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: false
    }, commonInitializationOptions ) );

    const allHTMLFilename = `${buildDir}/${repo}_all_${brand}.html`;
    const allHTMLContents = packageRunnable( {
      repo: repo,
      stringMap: stringMap,
      htmlHeader: htmlHeader,
      locale: ChipperConstants.FALLBACK_LOCALE,
      scripts: [ initializationScript, ...productionScripts ]
    } );

    grunt.file.write( allHTMLFilename, allHTMLContents );
    grunt.file.write( allHTMLFilename + '.gz', zlib.gzipSync( allHTMLContents ) );

  }

  // Debug build (always included)
  const debugInitializationScript = getInitializationScript( _.extend( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: true
  }, commonInitializationOptions ) );
  grunt.file.write( `${buildDir}/${repo}_all_${brand}_debug.html`, packageRunnable( {
    repo: repo,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    locale: ChipperConstants.FALLBACK_LOCALE,
    scripts: [ debugInitializationScript, ...debugScripts ]
  } ) );

  // XHTML build (ePub compatibility, etc.)
  const xhtmlDir = `${buildDir}/xhtml`;
  grunt.file.mkdir( xhtmlDir );
  const xhtmlInitializationScript = getInitializationScript( _.extend( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: false
  }, commonInitializationOptions ) );
  packageXHTML( xhtmlDir, {
    repo: repo,
    brand: brand,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    scripts: [ xhtmlInitializationScript, ...productionScripts ]
  } );

  // dependencies.json
  grunt.file.write( `${buildDir}/dependencies.json`, JSON.stringify( dependencies, null, 2 ) );

  // -iframe.html (English is assumed as the locale).
  if ( _.includes( locales, ChipperConstants.FALLBACK_LOCALE ) && brand === 'phet' ) {
    const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ getTitleStringKey( repo ) ];

    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    let iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( englishTitle + ' iframe test' ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_REPOSITORY}}', repo );

    const iframeLocales = [ 'en' ].concat( allHTML ? [ 'all' ] : [] );
    iframeLocales.forEach( locale => {
      const iframeHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_LOCALE}}', locale );
      grunt.file.write( `${buildDir}/${repo}_${locale}_iframe_phet.html`, iframeHtml );
    } );
  }

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if ( packageObject.phet.supportsInteractiveDescriptions && brand === 'phet' ) {
    // (a11y) Create the a11y-view HTML file for PDOM viewing.
    let a11yHTML = getA11yViewHTMLFromTemplate( repo );

    // this replaceAll is outside of the getA11yViewHTMLFromTemplate because we only want it filled in during the build
    a11yHTML = ChipperStringUtils.replaceAll( a11yHTML, '{{IS_BUILT}}', 'true' );

    grunt.file.write( `${buildDir}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML );
  }

  // copy over supplemental files or dirs to package with the build. Only supported in phet brand
  if ( packageObject.phet && packageObject.phet.packageWithBuild ) {

    assert( Array.isArray( packageObject.phet.packageWithBuild ) );
    packageObject.phet.packageWithBuild.forEach( path => {

      assert( typeof path === 'string', 'path should be a string' );
      assert( grunt.file.exists( path ), `path does not exist: ${path}` );
      if ( grunt.file.isDir( path ) ) {
        copyDirectory( path, `${buildDir}/${path}` );
      }
      else {
        grunt.file.copy( path, `${buildDir}/${path}` );
      }
    } );
  }

  if ( brand === 'phet-io' ) {
    await copySupplementalPhetioFiles( repo, version, englishTitle, packageObject, buildLocal );
  }

  // Thumbnails and twitter card
  if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
    const thumbnailSizes = [
      { width: 128, height: 84 },
      { width: 600, height: 394 }
    ];
    for ( const size of thumbnailSizes ) {
      grunt.file.write( `${buildDir}/${repo}-${size.width}.png`, await generateThumbnails( repo, size.width, size.height, 100, jimp.MIME_PNG ) );
    }

    if ( brand === 'phet' ) {
      grunt.file.write( `${buildDir}/${repo}-ios.png`, await generateThumbnails( repo, 420, 276, 90, jimp.MIME_JPEG ) );
      grunt.file.write( `${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard( repo ) );
    }
  }
};
