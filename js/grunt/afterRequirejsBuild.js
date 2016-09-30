// Copyright 2015, University of Colorado Boulder

/**
 * This (asynchronous) grunt task does things after the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// modules
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );
var createMipmapsJavaScript = require( '../../../chipper/js/grunt/createMipmapsJavaScript' );
var createHTMLFiles = require( '../../../chipper/js/grunt/createHTMLFiles' );
var reportUnusedMedia = require( '../../../chipper/js/grunt/reportUnusedMedia' );
var reportUnusedStrings = require( '../../../chipper/js/grunt/reportUnusedStrings' );
var copySupplementalPhETIOFiles = require( '../../../chipper/js/grunt/copySupplementalPhETIOFiles' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, buildConfig.requirejsNamespace );

  // After all strings have been loaded, report which of the translatable strings are unused.
  reportUnusedStrings( grunt, buildConfig );

  // For phet-io simulations, copy the other phet-io files, including "lib", "wrappers", etc.
  if ( buildConfig.brand === 'phet-io' ) {
    copySupplementalPhETIOFiles( grunt, buildConfig );
  }

  // Since this is an asynchronous task, each step in the task uses a callback to advance to the next step.
  // The final step in the task calls 'done', to tell grunt that the task has completed.
  createDependenciesJSON( grunt, buildConfig, function( dependenciesJSON ) {
    createMipmapsJavaScript( grunt, buildConfig, function( mipmapsJavaScript ) {
      createHTMLFiles( grunt, buildConfig, dependenciesJSON, mipmapsJavaScript, done );
    } );
  } );
};
