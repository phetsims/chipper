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
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig, stylesheets, bodystyle, outputFile, bodystart, addedPreload, stripPreload, qualifier ) {

  var repositoryName = buildConfig.name;
  var splashURL = '../brand/' + buildConfig.brand + '/images/splash.svg';
  var html = grunt.file.read( '../chipper/templates/sim-development.html' ); // the template file

  function notGA( preload ) {
    // skip the google-analytics preload
    return preload.indexOf( 'google-analytics' ) === -1;
  }

  var normalPreload = buildConfig.preload.filter( notGA );
  addedPreload && normalPreload.push( addedPreload );

  if ( stripPreload ) {
    var index = normalPreload.indexOf( stripPreload );
    if ( index === -1 ) { throw new Error( 'preload not found: ' + stripPreload );}
    normalPreload.splice( index, 1 );
  }

  // Formatting is very specific to the template file. Each preload is placed on separate line,
  // with an indentation that is specific indentation to the template. See chipper#462
  function stringifyArray( arr ) {
    return '[\n' +
           arr.map( function( string ) {
             return '      \'' + string.replace( /'/g, '\\\'' ) + '\'';
           } ).join( ', \n' ) +
           '\n    ]';
  }

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTYLE}}', bodystyle );
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTART}}', bodystart );
  html = ChipperStringUtils.replaceAll( html, '{{STYLESHEETS}}', stylesheets );
  html = ChipperStringUtils.replaceAll( html, '{{REPOSITORY}}', repositoryName );
  html = ChipperStringUtils.replaceAll( html, '{{QUALIFIER}}', qualifier );
  html = ChipperStringUtils.replaceAll( html, '{{BRAND}}', buildConfig.brand );
  html = ChipperStringUtils.replaceAll( html, '{{SPLASH_URL}}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{{PHETIO_PRELOADS}}', stringifyArray( buildConfig.phetioPreload ) );
  html = ChipperStringUtils.replaceAll( html, '{{PRELOADS}}', stringifyArray( normalPreload ) );

  // Use the repository name for the browser window title, because getting the sim's title
  // requires running the string plugin in build mode, which is too heavy-weight for this task.
  // See https://github.com/phetsims/chipper/issues/510
  html = ChipperStringUtils.replaceAll( html, '{{BROWSER_WINDOW_TITLE}}', repositoryName );

  // Write to the repository's root directory.
  grunt.file.write( outputFile, html );
};
