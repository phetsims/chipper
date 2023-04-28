// Copyright 2015-2023, University of Colorado Boulder

/**
 * Generates the top-level main HTML file for simulations (or runnables) using phet-brand splash and loading phet-io
 * preloads when brand=phet-io is specified.
 *
 * See https://github.com/phetsims/chipper/issues/63
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


// modules
const _ = require( 'lodash' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fixEOL = require( './fixEOL' );
const getPreloads = require( './getPreloads' );
const getStringRepos = require( './getStringRepos' );
const writeFileAndGitAdd = require( '../../../perennial-alias/js/common/writeFileAndGitAdd' );
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
    outputFile = `${repo}_en.html`,
    bodystart = '',
    addedPreloads = [], // none to add
    stripPreloads = [], // none to add
    mainFile = `../chipper/dist/js/${repo}/js/${repo}-main.js`,
    forSim = true // is this html used for a sim, or something else like tests.
  } = options || {};

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  const brand = 'phet';

  const splashURL = `../brand/${brand}/images/splash.svg`;
  let html = grunt.file.read( '../chipper/templates/sim-development.html' ); // the template file

  // Formatting is very specific to the template file. Each preload is placed on separate line,
  // with an indentation that is specific indentation to the template. See chipper#462
  function stringifyArray( arr, indentation ) {
    return `[\n${
      arr.map( string => `${indentation}    '${string.replace( /'/g, '\\\'' )}'` ).join( ',\n' )
    }\n${indentation}  ]`;
  }

  function isPreloadExcluded( preload ) {
    return preload.includes( 'google-analytics' ) || stripPreloads.includes( preload );
  }

  const indentLines = string => {
    return string.split( '\n' ).join( '\n    ' );
  };

  const preloads = getPreloads( repo, brand, forSim ).filter( preload => {
    return !isPreloadExcluded( preload );
  } ).concat( addedPreloads );
  const phetioPreloads = getPreloads( repo, 'phet-io', forSim ).filter( preload => {
    return !isPreloadExcluded( preload ) && !_.includes( preloads, preload );
  } );

  const stringRepos = await getStringRepos( repo );

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTYLE}}', bodystyle );
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTART}}', bodystart );
  html = ChipperStringUtils.replaceAll( html, '{{STYLESHEETS}}', stylesheets );
  html = ChipperStringUtils.replaceAll( html, '{{REPOSITORY}}', repo );
  html = ChipperStringUtils.replaceAll( html, '{{BRAND}}', brand );
  html = ChipperStringUtils.replaceAll( html, '{{SPLASH_URL}}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{{MAIN_FILE}}', mainFile );
  html = ChipperStringUtils.replaceAll( html, '{{PHET_IO_PRELOADS}}', stringifyArray( phetioPreloads, '  ' ) );
  html = ChipperStringUtils.replaceAll( html, '{{PRELOADS}}', stringifyArray( preloads, '' ) );
  html = ChipperStringUtils.replaceAll( html, '{{PACKAGE_OBJECT}}', indentLines( JSON.stringify( packageObject, null, 2 ) ) );
  html = ChipperStringUtils.replaceAll( html, '{{STRING_REPOS}}', indentLines( JSON.stringify( stringRepos, null, 2 ) ) );

  // Use the repository name for the browser window title, because getting the sim's title
  // requires running the string plugin in build mode, which is too heavy-weight for this task.
  // See https://github.com/phetsims/chipper/issues/510
  html = ChipperStringUtils.replaceAll( html, '{{BROWSER_WINDOW_TITLE}}', repo );

  // Write to the repository's root directory.
  await writeFileAndGitAdd( repo, outputFile, fixEOL( html ) );
};
