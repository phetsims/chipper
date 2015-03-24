// Copyright 2002-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 * Requires a package.json file containing project settings.
 * Tasks share information via global.phet, see individual tasks for details.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jon Olson
 * @author Sam Reid
 * @author John Blanco
 */

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );

// 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// PhET custom grunt tasks
var afterRequirejsBuild = require( '../../../chipper/js/grunt/afterRequirejsBuild' );
var beforeRequirejsBuild = require( '../../../chipper/js/grunt/beforeRequirejsBuild' );
var bumpVersion = require( '../../../chipper/js/grunt/bumpVersion' );
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var cloneDependencies = require( '../../../chipper/js/grunt/cloneDependencies' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var generateLicenseText = require( '../../../chipper/js/grunt/generateLicenseText' );
var generateREADME = require( '../../../chipper/js/grunt/generateREADME' );
var pullAll = require( '../../../chipper/js/grunt/pullAll' );
var stringReport = require( '../../../chipper/js/grunt/stringReport' );

//TODO look at why this is necessary
/*
 * In Node, global is the global namespace object.
 * Register fs as a global so it can be accessed through the requirejs build system. Text.js plugin
 * may have a superior way to handle this but I (SR) couldn't get it working after a small amount of effort.
 */
global.fs = fs;

module.exports = function( grunt ) {
  'use strict';

  var FALLBACK_LOCAL = 'en';

  // Read package.json, verify that it contains properties required by all PhET repositories
  assert( fs.existsSync( 'package.json' ), 'repository must have a package.json' );
  var pkg = grunt.file.readJSON( 'package.json' );
  assert( pkg.name, 'name missing from package.json' );
  assert( pkg.version, 'version missing from package.json' );
  assert( pkg.license, 'license missing from package.json' );

  var globalDefs = {
    // global assertions
    assert: false,
    assertSlow: false,
    // scenery logging
    sceneryLog: false,
    sceneryLayerLog: false,
    sceneryEventLog: false,
    sceneryAccessibilityLog: false,
    phetAllocation: false
  };

  // Delete arch references from the minified file, but only if it is not an arch build.
  var archRequired = pkg.preload && _.find( pkg.preload, function( repo ) { return repo === '../together/js/arch.js'; } ) !== undefined;
  if ( !archRequired ) {
    globalDefs.arch = false;
  }

  // Project configuration.
  grunt.initConfig( {
    /*
     * Read in the project settings from the package.json file into the pkg property.
     * This allows us to refer to project settings from within this config file.
     */
    pkg: pkg,

    // configure the RequireJS plugin
    requirejs: {

      // builds the minified script
      build: {
        options: {
          almond: true,
          mainConfigFile: 'js/<%= pkg.name %>-config.js',
          out: 'build/<%= pkg.name %>.min.js',
          name: '<%= pkg.name %>-config',

          // Minification strategy.  Put this to none if you want to debug a non-minified but compiled version
          optimize: 'uglify2',
          wrap: true,
//            generateSourceMaps: true, //#42 commented out this line until source maps are fixed
          preserveLicenseComments: false,
          uglify2: {
            output: {
              inline_script: true // escape </script
            },
            compress: {
              global_defs: globalDefs,
              dead_code: true
            }
          },

          //stub out the plugins so their source code won't be included in the minified file
          stubModules: [ 'string', 'audio', 'image' ]
        }
      }
    },

    // configure the JSHint plugin
    jshint: {

      // source files that are specific to this repository
      repoFiles: [ 'js/**/*.js' ],

      // All source files for this repository (repository-specific and dependencies).
      // Excludes kite/js/parser/svgPath.js, which is auto-generated.
      allFiles: [ _.map( pkg.phetLibs, function( repo ) { return '../' + repo + '/js/**/*.js'; } ), '!../kite/js/parser/svgPath.js' ],

      // reference external JSHint options in jshintOptions.js
      options: require( './jshintOptions' )
    }
  } );

  //---------------------------------------------------------------------------------------------------------------
  // Primary tasks
  //---------------------------------------------------------------------------------------------------------------

  // Default task ('grunt')
  grunt.registerTask( 'default', 'Builds the English HTML', [ 'build' ] );

  grunt.registerTask( 'build',
    'Builds the simulation:\n' +
    '--all-locales true:\n\tto build HTML for all locales in strings/\n' +
    '--locales $project:\n\tuse locales inferred from another project\'s strings/ directory\n' +
    '--locale fr:\n\tto build just the French locale\n' +
    '[no options]:\n\tto build just the English locale',
    [ 'lint-all', 'build-no-lint' ] );

  grunt.registerTask( 'build-no-lint',
    'identical to "build", but does not run "lint-all"',
    [ 'clean', 'generate-license-text', 'before-requirejs-build', 'requirejs:build', 'after-requirejs-build' ] );

  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', [ 'jshint:repoFiles' ] );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', [ 'jshint:allFiles' ] );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( fs.existsSync( 'build' ) ) {
        grunt.log.writeln( 'Cleaning build directory' );
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );

  grunt.registerTask( 'generate-license-text',
    'Generates the license text that will be written to the HTML file',
    function() {
      assert( pkg.preload, 'preload required in package.json' );
      generateLicenseText( grunt, pkg.preload );
    } );

  grunt.registerTask( 'before-requirejs-build',
    '(internal use only) Do things before the requirejs:build task',
    function() {
      assert( pkg.phetLibs, 'phetLibs missing from package.json' );
      assert( pkg.preload, 'preload missing from package.json' );
      beforeRequirejsBuild( grunt, pkg, FALLBACK_LOCAL );
    } );

  grunt.registerTask( 'after-requirejs-build',
    '(internal use only) Do things after the requirejs:build task',
    function() {
      afterRequirejsBuild( grunt, pkg, FALLBACK_LOCAL );
    } );

  //---------------------------------------------------------------------------------------------------------------
  // Utility tasks
  //---------------------------------------------------------------------------------------------------------------

  grunt.registerTask( 'checkout-shas',
    'Check out shas for a project, as specified in dependencies.json',
    function() {
      checkoutShas( grunt, pkg.name, false );
    } );

  grunt.registerTask( 'checkout-master',
    'Check out master branch for all dependencies, as specified in dependencies.json',
    function() {
      checkoutShas( grunt, pkg.name, true );
    } );

  grunt.registerTask( 'create-sim',
    'Create a sim based on the simula-rasa template.  Example usage: grunt create-sim --name=cannon-blaster --author="Jane Smith (Smith Inc.)"',
    function() {
      createSim( grunt, grunt.option( 'name' ), grunt.option( 'author' ), grunt.option( 'overwrite' ) );
    } );

  grunt.registerTask( 'generate-published-README',
    'Generates README.md file for a published simulation.',
    function() {
      assert( pkg.phetLibs, 'phetLibs missing from package.json' );
      assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' );
      generateREADME( grunt, pkg.name, pkg.phetLibs, pkg.simTitleStringKey, true /* published */ );
    } );

  grunt.registerTask( 'generate-unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    function() {
      assert( pkg.phetLibs, 'phetLibs missing from package.json' );
      assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' );
      generateREADME( grunt, pkg.name, pkg.phetLibs, pkg.simTitleStringKey, false /* published */ );
    } );

  grunt.registerTask( 'bump-version',
    'This task updates the last value in the version by one. For example from 0.0.0-dev.12 to 0.0.0-dev.13.' +
    'This updates the package.json and js/version.js files, and commits + pushes to git.' +
    'BEWARE: Do not run this task unless your git is clean, otherwise it will commit other work on your repo as well.',
    function() {
      bumpVersion( grunt, pkg.version );
    } );

  grunt.registerTask( 'pull-all',
    'Pull all repo above this directory',
    function() {
      pullAll( grunt );
    } );

  grunt.registerTask( 'string-report',
    'After doing a build, reports on which strings are missing for each locale that was built.',
    function() {
      stringReport( grunt, pkg.name, FALLBACK_LOCAL );
    } );

  grunt.registerTask( 'clone-dependencies',
    'Clones all dependencies of a project, as listed in package.json phetLibs entry',
    function() {
      assert( pkg.phetLibs, 'phetLibs missing from package.json' );
      cloneDependencies( grunt, pkg.name, pkg.phetLibs );
    } );

  /*
   * Load tasks from grunt plugins that have been installed locally using npm.
   * Put these in package.json and run 'npm install' before running grunt.
   */
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
