// Copyright 2015, University of Colorado Boulder

/**
 * This (asynchronous) grunt task does things after the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();

  // Since this is an asynchronous task, each step in the task uses a callback to advance to the next step.
  // The final step in the task calls 'done', to tell grunt that the task has completed.
  createDependenciesJSON( grunt, buildConfig, function( dependenciesJSON ) {
    console.log( dependenciesJSON );
    done();
  } );
};
