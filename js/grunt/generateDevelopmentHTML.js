// Copyright 2015, University of Colorado Boulder

/**
 * Generates the top-level main HTML file for simulations (or runnables), using the current brand's splash and preloads
 * that should be the same as the build-time preloads (minus Google Analytics).
 *
 * See https://github.com/phetsims/chipper/issues/63
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getPreloads = require( './getPreloads' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {string} repo
 */
module.exports = function( grunt, repo ) {
  const brand = 'phet';

  const splashURL = '../brand/' + brand + '/images/splash.svg';
  var html = grunt.file.read( '../chipper/templates/sim-development.html' ); // the template file

  // Formatting is very specific to the template file. Each preload is placed on separate line,
  // with an indentation that is specific indentation to the template. See chipper#462
  function stringifyArray( arr ) {
    return '[\n' +
           arr.map( function( string ) {
             return '      \'' + string.replace( /'/g, '\\\'' ) + '\'';
           } ).join( ', \n' ) +
           '\n    ]';
  }

  const preloads = getPreloads( grunt, repo, brand ).filter( preload => {
    return preload.indexOf( 'google-analytics' ) === -1;
  } );
  const phetioPreloads = getPreloads( grunt, repo, 'phet-io' ).filter( preload => {
    return preload.indexOf( 'google-analytics' ) === -1 && !_.includes( preloads, preload );
  } );

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{REPOSITORY}}', repo );
  html = ChipperStringUtils.replaceAll( html, '{{BRAND}}', brand );
  html = ChipperStringUtils.replaceAll( html, '{{SPLASH_URL}}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{{PHETIO_PRELOADS}}', stringifyArray( phetioPreloads ) );
  html = ChipperStringUtils.replaceAll( html, '{{PRELOADS}}', stringifyArray( preloads ) );

  // Use the repository name for the browser window title, because getting the sim's title
  // requires running the string plugin in build mode, which is too heavy-weight for this task.
  // See https://github.com/phetsims/chipper/issues/510
  html = ChipperStringUtils.replaceAll( html, '{{BROWSER_WINDOW_TITLE}}', repo );

  // Write to the repository's root directory.
  grunt.file.write( '../' + repo + '/' + repo + '_en.html', html );
};
