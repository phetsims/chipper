// Copyright 2015, University of Colorado Boulder

/**
 * Generates the top-level main HTML file for simulations (or runnables), using the current brand's splash and preloads
 * that should be the same as the build-time preloads (minus Google Analytics).
 *
 * See https://github.com/phetsims/chipper/issues/63
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var repositoryName = buildConfig.name;
  var splashURL = '../brand/' + buildConfig.brand + '/images/splash.svg';
  var html = grunt.file.read( '../chipper/templates/sim-development.html' );

  var packageJSON = grunt.file.readJSON( 'package.json' );
  var buildJSON = grunt.file.readJSON( '../chipper/build.json' );

  function notGA( preload ) {
    // skip the google-analytics preload
    return preload.indexOf( 'google-analytics' ) === -1;
  }

  var normalPreload = buildConfig.preload.filter( notGA );
  var ioPreload = buildConfig.getPreload( packageJSON, buildJSON, 'phet-io' ).filter( notGA );

  // Replace placeholders in the template.
  html = ChipperStringUtils.replaceAll( html, '{REPOSITORY}', repositoryName );
  html = ChipperStringUtils.replaceAll( html, '{BRAND}', buildConfig.brand );
  html = ChipperStringUtils.replaceAll( html, '{SPLASH_URL}', splashURL );
  html = ChipperStringUtils.replaceAll( html, '{IO_PRELOADS}', JSON.stringify( ioPreload ) );
  html = ChipperStringUtils.replaceAll( html, '{PRELOADS}', JSON.stringify( normalPreload ) );

  // Write to the repository's root directory.
  grunt.file.write( repositoryName + '_en.html', html );
};
