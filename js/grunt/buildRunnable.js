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
const buildMipmaps = require( './buildMipmaps' );
const ChipperConstants = require( '../common/ChipperConstants' );
const getDependencies = require( './getDependencies' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getPhetLibs = require( './getPhetLibs' );
const getPreloads = require( './getPreloads' );
const getStringMap = require( './getStringMap' );
const getVersionForBrand = require( '../getVersionForBrand' );
const minify = require( './minify' );
const packageRunnable = require( './packageRunnable' );
const requireBuild = require( './requireBuild' );

module.exports = async function( grunt, uglify, mangle, brand ) {
  const packageObject = grunt.file.readJSON( 'package.json' );
  const repo = packageObject.name;

  // All html files share the same build timestamp
  var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  var requireJS = await requireBuild( grunt, 'js/' + repo + '-config.js', { insertRequire: repo + '-main' } );

  if ( uglify ) {
    requireJS = minify( grunt, requireJS, { mangle: mangle } );
  }

  const preloads = getPreloads( grunt, brand ).map( filename => {
    var js = grunt.file.read( filename );

    if ( uglify ) {
      js = minify( grunt, js, { mangle } );
    }

    return js;
  } );

  const phetLibs = getPhetLibs( grunt, repo, brand );
  const locales = [ ChipperConstants.FALLBACK_LOCALE ].concat( getLocalesFromRepository( grunt, repo ) );
  const dependencies = await getDependencies( grunt, repo );
  const version = getVersionForBrand( brand, packageObject.version );

  const commonOptions = {
    brand,
    stringMap: getStringMap( grunt, locales, phetLibs ),
    mainInlineJavascript: requireJS,
    preloadScripts: preloads,
    mipmapsJavaScript: await buildMipmaps( grunt ),
    dependencies,
    timestamp,
    version,
    thirdPartyEntries: {}, // TODO
  };

  for ( let locale of locales ) {
    grunt.file.write( 'build/' + repo + '_' + locale + '.html', packageRunnable( grunt, _.extend( {
      locale,
      includeAllLocales: false
    }, commonOptions ) ) );
  }

  grunt.file.write( 'build/' + repo + '_all.html', packageRunnable( grunt, _.extend( {
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true
  }, commonOptions ) ) );

  // TODO: sanity checks
  // TODO: iframe bits, accessibility, etc.
};
