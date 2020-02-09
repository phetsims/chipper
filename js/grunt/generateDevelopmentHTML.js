// Copyright 2015-2019, University of Colorado Boulder

/**
 * Generates the top-level main HTML file for simulations (or runnables), using the current brand's splash and preloads
 * that should be the same as the build-time preloads (minus Google Analytics).
 *
 * See https://github.com/phetsims/chipper/issues/63
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fs = require( 'fs' );
const getDependencies = require( './getDependencies' );
const getPreloads = require( './getPreloads' );
const grunt = require( 'grunt' );

/**
 * @param {string} repo
 * @param {Object} [options]
 *
 * @returns {Promise}
 */
module.exports = async function( repo, options ) {

  const {
    stylesheets = '',
    bodystyle = ' style="background-color:black;"', // note the preceding ' ' which is essential
    outputFile = `../${repo}/${repo}_en.html`,
    bodystart = '',
    addedPreloads = [], // none to add
    stripPreloads = [], // none to add
    qualifier = '',
    forSim = true // is this html used for a sim, or something else like tests.
  } = options || {};

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  const brand = 'phet';

  const splashURL = `../brand/${brand}/images/splash.svg`;
  let html = grunt.file.read( '../chipper/templates/sim-development.html' ); // the template file

  // Formatting is very specific to the template file. Each preload is placed on separate line,
  // with an indentation that is specific indentation to the template. See chipper#462
  function stringifyArray( arr, prefix ) {
    return '[\n' +
           arr.map( function( string ) {
             return prefix + '    \'' + string.replace( /'/g, '\\\'' ) + '\'';
           } ).join( ',\n' ) +
           '\n' + prefix + '  ]';
  }

  function isPreloadExcluded( preload ) {
    return preload.includes( 'google-analytics' ) || stripPreloads.includes( preload );
  }

  const preloads = getPreloads( repo, brand, forSim ).filter( preload => {
    return !isPreloadExcluded( preload );
  } ).concat( addedPreloads );
  const phetioPreloads = getPreloads( repo, 'phet-io', forSim ).filter( preload => {
    return !isPreloadExcluded( preload ) && !_.includes( preloads, preload );
  } );

  const stringRepos = Object.keys( await getDependencies( repo ) ).filter( repo => repo !== 'comment' ).filter( repo => {
    return fs.existsSync( `../${repo}/${repo}-strings_en.json` );
  } ).map( repo => {
    return {
      repo: repo,
      requirejsNamespace: grunt.file.readJSON( `../${repo}/package.json` ).phet.requirejsNamespace
    };
  } );

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTYLE}}', bodystyle );
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTART}}', bodystart );
  html = ChipperStringUtils.replaceAll( html, '{{STYLESHEETS}}', stylesheets );
  html = ChipperStringUtils.replaceAll( html, '{{REPOSITORY}}', repo );
  html = ChipperStringUtils.replaceAll( html, '{{QUALIFIER}}', qualifier );
  html = ChipperStringUtils.replaceAll( html, '{{BRAND}}', brand );
  html = ChipperStringUtils.replaceAll( html, '{{SPLASH_URL}}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_IO_PRELOADS}}', stringifyArray( phetioPreloads, '  ' ) );
  html = ChipperStringUtils.replaceAll( html, '{{PRELOADS}}', stringifyArray( preloads, '' ) );
  html = ChipperStringUtils.replaceAll( html, '{{PACKAGE_OBJECT}}', JSON.stringify( packageObject ) );
  html = ChipperStringUtils.replaceAll( html, '{{STRING_REPOS}}', JSON.stringify( stringRepos ) );

  // Use the repository name for the browser window title, because getting the sim's title
  // requires running the string plugin in build mode, which is too heavy-weight for this task.
  // See https://github.com/phetsims/chipper/issues/510
  html = ChipperStringUtils.replaceAll( html, '{{BROWSER_WINDOW_TITLE}}', repo );

  // Write to the repository's root directory.
  grunt.file.write( outputFile, html );
};
