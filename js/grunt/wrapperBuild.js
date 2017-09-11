// Copyright 2015, University of Colorado Boulder

/**
 * This (asynchronous) grunt task builds and minifies an individual wrapper.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var copyDirectory = require( '../../../chipper/js/grunt/phet-io/copyDirectory' );
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );

// Don't copy these files/folders into the built wrapper
var WRAPPER_BLACKLIST = [ '.git', 'README.md', '.gitignore', 'node_modules', 'build' ];


/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();

  buildConfig.phetLibs.forEach( function( repo ) {

    //  We only need the common folder from this repo
    if ( repo === 'phet-io-wrappers' ) {
      repo = 'phet-io-wrappers/common';
    }
    copyDirectory( grunt, '../' + repo, ChipperConstants.BUILD_DIR + '/' + repo + '/', null, {
      blacklist: WRAPPER_BLACKLIST, // List of files to not copy

      // TODO: We want to minify the built wrapper, but currently it is causing an error,
      // see https://github.com/phetsims/phet-io-wrapper-sonification/issues/19#event-1153696188
      minifyJS: true,
      licenseToPrepend: '// Copyright 2002-2017, University of Colorado Boulder\n' +
                        '// This PhET-iO file requires a license\n' +
                        '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                        '// For licensing, please contact phethelp@colorado.edu\n\n'
    } );
  } );


  // Since this is an asynchronous task, each step in the task uses a callback to advance to the next step.
  // The final step in the task calls 'done', to tell grunt that the task has completed.
  createDependenciesJSON( grunt, buildConfig, function( dependenciesJSON ) {
    done();
  } );
};
