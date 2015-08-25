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
 */

// modules
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );
var reportUnusedMedia = require( '../../../chipper/js/grunt/reportUnusedMedia' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see initBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt that this task is asynchronous
  var done = grunt.task.current.async();

  // After all media plugins have completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, buildConfig.requirejsNamespace );

  // Begin the multi-step asynchronous build process described above.
  createDependenciesJSON( grunt, buildConfig, done );
};
