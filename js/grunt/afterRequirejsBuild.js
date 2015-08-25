// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things after the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 *
 * Due to the asynchronous nature of determining shas and branch names for dependencies (via child_process.exec)
 * and creating scripts for mipmaps, the overall structure of this task is necessarily nested, relying on callbacks.
 *
 * Here's the basic flow of this task:
 *
 * createDependenciesJSON() {
 *
 *   var dependenciesJSON = ... // create JSON that describes dependencies
 *   write dependencies.json file;
 *
 *   createMipmaps( dependenciesJSON ) {
 *
 *     var mipmapsJavascript = ... // create script for mipmaps
 *
 *     createHTMLFiles( dependenciesJSON, mipmapsJavascript ) {
 *       replace tokens in HTML template;
 *       write locale-specific HMTL files;
 *       done;
 *     }
 *   }
 * }
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// modules
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );
var createMipmapsJavaScript = require( '../../../chipper/js/grunt/createMipmapsJavaScript' );
var createHTMLFiles = require( '../../../chipper/js/grunt/createHTMLFiles' );
var reportUnusedMedia = require( '../../../chipper/js/grunt/reportUnusedMedia' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see initBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, buildConfig.requirejsNamespace );

  // The multi-step asynchronous task described above.
  // For each step, a callback function invokes the next step.
  createDependenciesJSON( grunt, buildConfig, function( dependenciesJSON ) {
    createMipmapsJavaScript( grunt, buildConfig, dependenciesJSON, function( dependenciesJSON, mipmapsJavaScript ) {
      createHTMLFiles( grunt, buildConfig, dependenciesJSON, mipmapsJavaScript, done );
    } );
  } );
};
