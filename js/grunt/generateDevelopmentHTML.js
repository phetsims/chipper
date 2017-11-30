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
var _ = require( '../../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 * @param {Object} [options]
 */
module.exports = function( grunt, buildConfig, options ) {

  options = _.extend( {
    stylesheets: '',
    bodystyle: 'style="background-color:black;"',
    outputFile: buildConfig.name + '_en.html',
    bodystart: '',
    addedPreloads: [], // none to add
    stripPreload: null, // none to add
    qualifier: ''
  }, options );

  var repositoryName = buildConfig.name;
  var splashURL = '../brand/' + buildConfig.brand + '/images/splash.svg';
  var html = grunt.file.read( '../chipper/templates/sim-development.html' ); // the template file

  function notGA( preload ) {
    // skip the google-analytics preload
    return preload.indexOf( 'google-analytics' ) === -1;
  }

  var normalPreload = buildConfig.preload.filter( notGA );
  options.addedPreloads.forEach( function( addedPreload ) {
    normalPreload.push( addedPreload );
  } );

  if ( options.stripPreload ) {
    var index = normalPreload.indexOf( options.stripPreload );
    if ( index === -1 ) { throw new Error( 'preload not found: ' + options.stripPreload );}
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
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTYLE}}', options.bodystyle );
  html = ChipperStringUtils.replaceAll( html, '{{BODYSTART}}', options.bodystart );
  html = ChipperStringUtils.replaceAll( html, '{{STYLESHEETS}}', options.stylesheets );
  html = ChipperStringUtils.replaceAll( html, '{{REPOSITORY}}', repositoryName );
  html = ChipperStringUtils.replaceAll( html, '{{QUALIFIER}}', options.qualifier );
  html = ChipperStringUtils.replaceAll( html, '{{BRAND}}', buildConfig.brand );
  html = ChipperStringUtils.replaceAll( html, '{{SPLASH_URL}}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{{PHETIO_PRELOADS}}', stringifyArray( buildConfig.phetioPreload ) );
  html = ChipperStringUtils.replaceAll( html, '{{PRELOADS}}', stringifyArray( normalPreload ) );

  // Use the repository name for the browser window title, because getting the sim's title
  // requires running the string plugin in build mode, which is too heavy-weight for this task.
  // See https://github.com/phetsims/chipper/issues/510
  html = ChipperStringUtils.replaceAll( html, '{{BROWSER_WINDOW_TITLE}}', repositoryName );

  // Write to the repository's root directory.
  grunt.file.write( options.outputFile, html );
};
