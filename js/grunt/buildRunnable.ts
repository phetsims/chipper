// Copyright 2017-2025, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import assert from 'assert';
import fs, { readFileSync } from 'fs';
import jimp from 'jimp';
import _ from 'lodash';
import zlib from 'zlib';
import affirm from '../../../perennial-alias/js/browser-and-node/affirm.js';
import phetTimingLog from '../../../perennial-alias/js/common/phetTimingLog.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperConstants from '../common/ChipperConstants.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getLicenseEntry from '../common/getLicenseEntry.js';
import loadFileAsDataURI from '../common/loadFileAsDataURI.js';
import copyDirectory from './copyDirectory.js';
import copySupplementalPhetioFiles from './copySupplementalPhetioFiles.js';
import generateThumbnails from './generateThumbnails.js';
import generateTwitterCard from './generateTwitterCard.js';
import getA11yViewHTML from './getA11yViewHTML.js';
import getAllThirdPartyEntries, { LicenseEntries } from './getAllThirdPartyEntries.js';
import getDependencies from './getDependencies.js';
import getInitializationScript from './getInitializationScript.js';
import getLocalesFromRepository from './getLocalesFromRepository.js';
import getPhetLibs from './getPhetLibs.js';
import getPreloads from './getPreloads.js';
import getPrunedLocaleData from './getPrunedLocaleData.js';
import getStringMap from './getStringMap.js';
import getTitleStringKey from './getTitleStringKey.js';
import gruntTimingLog from './gruntTimingLog.js';
import minify, { MinifyOptions } from './minify.js';
import packageRunnable from './packageRunnable.js';
import packageXHTML from './packageXHTML.js';
import reportUnusedMedia from './reportUnusedMedia.js';
import reportUnusedStrings from './reportUnusedStrings.js';
import webpackBuild from './webpackBuild.js';

const nodeHtmlEncoder = require( 'node-html-encoder' );

/**
 * Builds a runnable (e.g. a simulation).
 *
 * @param repo
 * @param minifyOptions - see minify.js
 * @param allHTML - If the _all.html file should be generated
 * @param brand
 * @param localesOption - e.g,. '*', 'en,es', etc.
 * @param encodeStringMap
 * @param compressScripts
 * @param profileFileSize
 * @param typeCheck
 */
export default async function( repo: string, minifyOptions: MinifyOptions, allHTML: boolean, brand: string, localesOption: string,
                               encodeStringMap: boolean, compressScripts: boolean, profileFileSize: boolean,
                               typeCheck: boolean ): Promise<void> {

  if ( brand === 'phet-io' ) {
    affirm( grunt.file.exists( '../phet-io' ), 'Aborting the build of phet-io brand since proprietary repositories are not checked out.\nPlease use --brands=={{BRAND}} in the future to avoid this.' );
  }

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const encoder = new nodeHtmlEncoder.Encoder( 'entity' );

  // All html files share the same build timestamp
  let timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = `${timestamp.substring( 0, timestamp.indexOf( '.' ) )} UTC`;

  // Start running webpack
  const webpackResult = await phetTimingLog.startAsync( 'webpack', async () => webpackBuild( repo, brand, {
    profileFileSize: profileFileSize
  } ), {
    timingCallback: time => gruntTimingLog( 'Webpack build complete', time )
  } );

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  const webpackJS = wrapProfileFileSize( `phet.chipper.runWebpack = function() {${webpackResult.js}};`, profileFileSize, 'WEBPACK' );

  // Debug version is independent of passed in minifyOptions.  PhET-iO brand is minified, but leaves assertions & logging.
  const debugMinifyOptions = brand === 'phet-io' ? {
    stripAssertions: false,
    stripLogging: false
  } : {
    minify: false
  };

  // If turning off minification for the main build, don't minify the debug version also
  if ( !minifyOptions.minify ) {
    debugMinifyOptions.minify = false;
  }

  const usedModules = webpackResult.usedModules;
  reportUnusedMedia( repo, usedModules );

  // TODO: More specific object type, see https://github.com/phetsims/chipper/issues/1538
  const licenseEntries: LicenseEntries = {};
  ChipperConstants.MEDIA_TYPES.forEach( mediaType => {
    licenseEntries[ mediaType ] = {};
  } );

  usedModules.forEach( module => {
    ChipperConstants.MEDIA_TYPES.forEach( mediaType => {
      if ( module.split( '/' )[ 1 ] === mediaType ) {

        // The file suffix is stripped and restored to its non-js extension. This is because getLicenseEntry doesn't
        // handle modulified media files.
        const index = module.lastIndexOf( '_' );
        const path = `${module.slice( 0, index )}.${module.slice( index + 1, -3 )}`;

        // TODO: More specific object type, see https://github.com/phetsims/chipper/issues/1538
        // @ts-expect-error https://github.com/phetsims/chipper/issues/1538
        licenseEntries[ mediaType ][ module ] = getLicenseEntry( `../${path}` );
      }
    } );
  } );

  const phetLibs = getPhetLibs( repo, brand );
  const allLocales = [ ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository( repo ) ];
  const locales = localesOption === '*' ? allLocales : localesOption.split( ',' );
  const dependencies = await getDependencies( repo );
  const dependencyReps = Object.keys( dependencies );

  // on Windows, paths are reported with a backslash, normalize to forward slashes so this works everywhere

  usedModules.map( module => module.split( '\\' ).join( '/' ) ).forEach( moduleDependency => {

    // The first part of the path is the repo.  Or if no directory is specified, the file is in the sim repo.
    const pathSeparatorIndex = moduleDependency.indexOf( '/' );
    const moduleRepo = pathSeparatorIndex >= 0 ? moduleDependency.slice( 0, pathSeparatorIndex ) :
                       repo;
    assert && assert( dependencyReps.includes( moduleRepo ), `repo ${moduleRepo} missing from package.json's phetLibs for ${moduleDependency}` );

    // Also check if the module was coming from chipper dist
    if ( moduleDependency.includes( 'chipper/dist/js/' ) ) {
      const distRepo = moduleDependency.split( 'chipper/dist/js/' )[ 1 ]?.split( '/' )[ 0 ];
      distRepo && assert && assert( dependencyReps.includes( distRepo ), `repo ${distRepo} missing from package.json's phetLibs for ${moduleDependency}` );
    }
  } );

  const version = packageObject.version; // Include the one-off name in the version
  const thirdPartyEntries = getAllThirdPartyEntries( repo, brand, licenseEntries );
  const simTitleStringKey = getTitleStringKey( repo );

  const { stringMap, stringMetadata } = getStringMap( repo, allLocales, phetLibs, webpackResult.usedModules );

  // After our string map is constructed, report which of the translatable strings are unused.
  reportUnusedStrings( repo, packageObject.phet.requirejsNamespace, stringMap[ ChipperConstants.FALLBACK_LOCALE ] );

  // If we have NO strings for a given locale that we want, we'll need to fill it in with all English strings, see
  // https://github.com/phetsims/perennial/issues/83
  for ( const locale of locales ) {
    if ( !stringMap[ locale ] ) {
      stringMap[ locale ] = stringMap[ ChipperConstants.FALLBACK_LOCALE ];
    }
  }

  const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ simTitleStringKey ];
  assert && assert( englishTitle, `missing entry for sim title, key = ${simTitleStringKey}` );

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  let htmlHeader;
  if ( brand === 'phet-io' ) {

    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = `${englishTitle} ${version}\n` +
                 `Copyright 2002-${grunt.template.today( 'yyyy' )}, Regents of the University of Colorado\n` +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This Interoperable PhET Simulation file requires a license.\n' +
                 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                 'Contact phethelp@colorado.edu regarding licensing.\n' +
                 'https://phet.colorado.edu/en/licensing';
  }
  else {
    htmlHeader = `${englishTitle} ${version}\n` +
                 `Copyright 2002-${grunt.template.today( 'yyyy' )}, Regents of the University of Colorado\n` +
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
    wrapProfileFileSize( `window.PHET_SPLASH_DATA_URI="${loadFileAsDataURI( `../brand/${brand}/images/splash.svg` )}";`, profileFileSize, 'SPLASH' )
  ];

  const minifiableScripts = [
    // Preloads

    ...getPreloads( repo, brand, true ).map( filename => wrapProfileFileSize( grunt.file.read( filename ), profileFileSize, 'PRELOAD', filename ) ),

    // Our main module content, wrapped in a function called in the startup below
    webpackJS,

    // Main startup
    wrapProfileFileSize( grunt.file.read( '../chipper/templates/chipper-startup.js' ), profileFileSize, 'STARTUP' )
  ];

  const productionScripts = await phetTimingLog.startAsync( 'minify-production', async () => {
    return [
      ...startupScripts,
      ...minifiableScripts.map( js => minify( js, minifyOptions ) )
    ] satisfies string[];
  }, {
    timingCallback: ( time, scripts ) => gruntTimingLog( 'Production minify complete', time, _.sum( scripts.map( js => js.length ) ) )
  } );
  const debugScripts = await phetTimingLog.startAsync( 'minify-debug', async () => {
    return [
      ...startupScripts,
      ...minifiableScripts.map( js => minify( js, debugMinifyOptions ) )
    ];
  }, {
    timingCallback: ( time, scripts ) => gruntTimingLog( 'Debug minify complete', time, _.sum( scripts.map( js => js.length ) ) )
  } );

  const licenseScript = wrapProfileFileSize( ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/license-initialization.js' ), {
    PHET_START_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES,
    PHET_THIRD_PARTY_LICENSE_ENTRIES: JSON.stringify( thirdPartyEntries, null, 2 ),
    PHET_END_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES
  } ), profileFileSize, 'LICENSE' );

  const commonInitializationOptions = {
    brand: brand,
    repo: repo,
    localeData: getPrunedLocaleData( allLocales ),
    stringMap: stringMap,
    stringMetadata: stringMetadata,
    dependencies: dependencies,
    timestamp: timestamp,
    version: version,
    packageObject: packageObject,
    allowLocaleSwitching: false,
    encodeStringMap: encodeStringMap,
    profileFileSize: profileFileSize,
    wrapStringsJS: ( stringsJS: string ) => wrapProfileFileSize( stringsJS, profileFileSize, 'STRINGS' )
  };

  // Create the build-specific directory
  const buildDir = `../${repo}/build/${brand}`;
  fs.mkdirSync( buildDir, { recursive: true } );

  // {{locale}}.html
  if ( brand !== 'phet-io' ) {
    for ( const locale of locales ) {
      const initializationScript = getInitializationScript( _.assignIn( {
        locale: locale,
        includeAllLocales: false,
        isDebugBuild: false
      }, commonInitializationOptions ) );

      grunt.file.write( `${buildDir}/${repo}_${locale}_${brand}.html`, packageRunnable( {
        repo: repo,
        stringMap: stringMap,
        htmlHeader: htmlHeader,
        locale: locale,
        compressScripts: compressScripts,
        licenseScript: licenseScript,
        scripts: [ initializationScript, ...productionScripts ]
      } ) );
    }
  }

  // _all.html (forced for phet-io)
  if ( allHTML || brand === 'phet-io' ) {
    const initializationScript = getInitializationScript( _.assignIn( {
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: false
    }, commonInitializationOptions, {
      allowLocaleSwitching: true
    } ) );

    const allHTMLFilename = `${buildDir}/${repo}_all_${brand}.html`;
    const allHTMLContents = packageRunnable( {
      repo: repo,
      stringMap: stringMap,
      htmlHeader: htmlHeader,
      locale: ChipperConstants.FALLBACK_LOCALE,
      compressScripts: compressScripts,
      licenseScript: licenseScript,
      scripts: [ initializationScript, ...productionScripts ]
    } );

    grunt.file.write( allHTMLFilename, allHTMLContents );

    // Add a compressed file to improve performance in the iOS app, see https://github.com/phetsims/chipper/issues/746
    grunt.file.write( `${allHTMLFilename}.gz`, zlib.gzipSync( allHTMLContents ) );
  }

  // Debug build (always included)
  const debugInitializationScript = getInitializationScript( _.assignIn( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: true
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  } ) );

  grunt.file.write( `${buildDir}/${repo}_all_${brand}_debug.html`, packageRunnable( {
    repo: repo,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    locale: ChipperConstants.FALLBACK_LOCALE,
    compressScripts: compressScripts,
    licenseScript: licenseScript,
    scripts: [ debugInitializationScript, ...debugScripts ]
  } ) );

  // XHTML build (ePub compatibility, etc.)
  const xhtmlDir = `${buildDir}/xhtml`;
  fs.mkdirSync( xhtmlDir, { recursive: true } );

  const xhtmlInitializationScript = getInitializationScript( _.assignIn( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: false
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  } ) );

  packageXHTML( xhtmlDir, {
    repo: repo,
    brand: brand,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    initializationScript: xhtmlInitializationScript,
    licenseScript: licenseScript,
    scripts: productionScripts
  } );

  // dependencies.json
  grunt.file.write( `${buildDir}/dependencies.json`, JSON.stringify( dependencies, null, 2 ) );

  // string-map.json and english-string-map.json, for things like Rosetta that need to know what strings are used
  grunt.file.write( `${buildDir}/string-map.json`, JSON.stringify( stringMap, null, 2 ) );
  grunt.file.write( `${buildDir}/english-string-map.json`, JSON.stringify( stringMap.en, null, 2 ) );

  // -iframe.html (English is assumed as the locale).
  if ( _.includes( locales, ChipperConstants.FALLBACK_LOCALE ) && brand === 'phet' ) {
    const englishTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ getTitleStringKey( repo ) ];

    grunt.log.verbose.writeln( 'Constructing HTML for iframe testing from template' );
    let iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( `${englishTitle} iframe test` ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_REPOSITORY}}', repo );

    const iframeLocales = [ 'en' ].concat( allHTML ? [ 'all' ] : [] );
    iframeLocales.forEach( locale => {
      const iframeHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_LOCALE}}', locale );
      grunt.file.write( `${buildDir}/${repo}_${locale}_iframe_phet.html`, iframeHtml );
    } );
  }

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if ( packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription && ( brand === 'phet' || brand === 'phet-io' ) ) {
    // (a11y) Create the a11y-view HTML file for PDOM viewing.
    let a11yHTML = getA11yViewHTML( repo, brand );

    // this replaceAll is outside of the getA11yViewHTML because we only want it filled in during the build
    a11yHTML = ChipperStringUtils.replaceAll( a11yHTML, '{{IS_BUILT}}', 'true' );

    grunt.file.write( `${buildDir}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML );
  }

  // copy over supplemental files or dirs to package with the build. Only supported in phet brand
  if ( packageObject.phet && packageObject.phet.packageWithBuild ) {

    assert && assert( Array.isArray( packageObject.phet.packageWithBuild ) );

    packageObject.phet.packageWithBuild.forEach( ( path: string ) => {

      // eslint-disable-next-line phet/no-simple-type-checking-assertions
      assert && assert( typeof path === 'string', 'path should be a string' );
      assert && assert( grunt.file.exists( path ), `path does not exist: ${path}` );
      if ( grunt.file.isDir( path ) ) {
        copyDirectory( path, `${buildDir}/${path}` );
      }
      else {
        grunt.file.copy( path, `${buildDir}/${path}` );
      }
    } );
  }

  if ( brand === 'phet-io' ) {
    await phetTimingLog.startAsync( 'phet-io-sub-build', async () => {
      await copySupplementalPhetioFiles( repo, version, englishTitle, packageObject, true, typeCheck );
    }, {
      timingCallback: time => gruntTimingLog( 'PhET-iO artifacts complete', time )
    } );
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
}

// For profiling file size. Name is optional
const wrapProfileFileSize = ( string: string, profileFileSize: boolean, type: string, name?: string ) => {
  if ( profileFileSize ) {
    const conditionalName = name ? `,"${name}"` : '';
    return `console.log("START_${type.toUpperCase()}"${conditionalName});\n${string}\nconsole.log("END_${type.toUpperCase()}"${conditionalName});\n\n`;
  }
  else {
    return string;
  }
};