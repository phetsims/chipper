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
const copySupplementalPhETIOFiles = require( './phet-io/copySupplementalPhETIOFiles' );
const getAllThirdPartyEntries = require( './getAllThirdPartyEntries' );
const getDependencies = require( './getDependencies' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getLocalesToBuild = require( './getLocalesToBuild' );
const getPhetLibs = require( './getPhetLibs' );
const getPreloads = require( './getPreloads' );
const getStringMap = require( './getStringMap' );
const getVersionForBrand = require( '../getVersionForBrand' );
const minify = require( './minify' );
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
 * @param {string} brand
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function( grunt, repo, uglify, mangle, brand ) {
  assert( typeof repo === 'string' );
  assert( typeof uglify === 'boolean' );
  assert( typeof mangle === 'boolean' );
  assert( _.includes( ChipperConstants.BRANDS, brand ), 'Unknown brand in buildRunnable: ' + brand );

  const packageObject = grunt.file.readJSON( '../' + repo + '/package.json' );

  // All html files share the same build timestamp
  var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  // TODO: Find a better way
  var requireJS = await requireBuild( grunt, '../' + repo + '/js/' + repo + '-config.js', { insertRequire: repo + '-main', brand } );

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, packageObject.phet.requirejsNamespace );

  // After all strings have been loaded, report which of the translatable strings are unused.
  reportUnusedStrings( grunt, repo, packageObject.phet.requirejsNamespace );

  if ( uglify ) {
    requireJS = minify( grunt, requireJS, { mangle: mangle } );
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

  const commonOptions = {
    brand,
    repo,
    stringMap: getStringMap( grunt, allLocales, phetLibs ),
    mainInlineJavascript: requireJS,
    preloadScripts: preloads,
    mipmapsJavaScript: await buildMipmaps( grunt ),
    dependencies,
    timestamp,
    version,
    thirdPartyEntries
  };

  for ( let locale of locales ) {
    grunt.file.write( '../' + repo + '/build/' + repo + '_' + locale + '.html', packageRunnable( grunt, _.extend( {
      locale,
      includeAllLocales: false
    }, commonOptions ) ) );
  }

  grunt.file.write( '../' + repo + '/build/' + repo + '_all.html', packageRunnable( grunt, _.extend( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true
  }, commonOptions ) ) );

  grunt.file.write( '../' + repo + '/build/dependencies.json', JSON.stringify( dependencies, null, 2 ) );

  if ( brand === 'phet-io' ) {
    await copySupplementalPhETIOFiles( grunt, repo, version );
  }

  // TODO: sanity checks
  // TODO: iframe bits, accessibility, etc.
};
