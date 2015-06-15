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
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// PhET custom grunt tasks
var afterRequirejsBuild = require( '../../../chipper/js/grunt/afterRequirejsBuild' );
var beforeRequirejsBuild = require( '../../../chipper/js/grunt/beforeRequirejsBuild' );
var bumpVersion = require( '../../../chipper/js/grunt/bumpVersion' );
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var deploySimulation = require( '../../../chipper/js/grunt/deploySimulation' );
var generateREADME = require( '../../../chipper/js/grunt/generateREADME' );
var generateThumbnails = require( '../../../chipper/js/grunt/generateThumbnails' );
var pullAll = require( '../../../chipper/js/grunt/pullAll' );
var setPreload = require( '../../../chipper/js/grunt/setPreload' );
var setThirdPartyLicenses = require( '../../../chipper/js/grunt/setThirdPartyLicenses' );
var stringReport = require( '../../../chipper/js/grunt/stringReport' );
var createXML = require( '../../../chipper/js/grunt/createXML' );

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

  // For sims, read common phetLibs from chipper/build.json. We'll do this here since several grunt tasks (including some utilities) need phetLibs.
  if ( pkg.phetLibs ) {
    assert( fs.existsSync( '../chipper/build.json' ), 'missing build.json' );
    var buildInfo = grunt.file.readJSON( '../chipper/build.json' );
    pkg.phetLibs = _.uniq( pkg.phetLibs.concat( buildInfo.common.phetLibs ).sort() );
    grunt.log.writeln( 'phetLibs = ' + pkg.phetLibs );
  }

  // TODO: As a temporary means of keeping track of "together" versions, replace "-dev" with "-together" in the version
  // string. This approach has a lot of problems and should be replaced as soon as we work out a more all encompassing
  // way of tracking together-enhanced versions.  See https://github.com/phetsims/special-ops/issues/3 for more info.
  if ( grunt.option( 'together' ) && pkg.version.indexOf( '-dev' ) > -1 ) {
    pkg.version = pkg.version.replace( '-dev', '-together' );
  }

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
    'with no options, builds HTML for English only\n' +
    '--locales=* : all locales in strings/ directory\n' +
    '--locales=fr : French\n' +
    '--locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)\n' +
    '--localesRepo=$repo : all locales in another repository\'s strings/ directory, ignored if --locales is present\n' +
    '--together : adds additional preload files needed to support together.js\n',
    [ 'lint-all', 'build-no-lint' ]
  );

  grunt.registerTask( 'build-no-lint',
    'identical to "build", but does not run "lint-all"',
    [ 'clean', 'set-preload', 'set-third-party-licenses', 'before-requirejs-build', 'requirejs:build', 'after-requirejs-build' ] );

  grunt.registerTask( 'deploy-production',
    'Deploy a simulation. Should be run AFTER grunt build\n' +
    'with no options, deploys to phet-dev (since this is still being tested)\n' +
    '--production : deploy to figaro (not yet implemented)\n',
    function() {
      deploySimulation( grunt, grunt.option( 'production' ) );
    }
  );

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

  grunt.registerTask( 'set-preload',
    'Determines the set of files that will be preloaded in the HTML file',
    function() {
      setPreload( grunt, pkg );
    } );

  grunt.registerTask( 'set-third-party-licenses',
    'Sets global.phet.thirdPartyLicenses, an object literal that will be written to the HTML file',
    function() {
      setThirdPartyLicenses( grunt, pkg );
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
      var buildServer = grunt.option( 'buildServer' ) ? true : false;
      checkoutShas( grunt, pkg.name, false, buildServer );
    } );

  grunt.registerTask( 'checkout-master',
    'Check out master branch for all dependencies, as specified in dependencies.json',
    function() {
      checkoutShas( grunt, pkg.name, true );
    } );

  grunt.registerTask( 'create-sim',
    'Creates a sim based on the simula-rasa template.\n' +
    '--name="string" : the repository name\n' +
    '--author="string" : the author name\n' +
    '--title="string" : (optional) the simulation title\n' +
    '--clean=true : (optional) deletes the repository directory if it exists',
    function() {
      createSim( grunt, grunt.option( 'name' ), grunt.option( 'author' ), grunt.option( 'title' ), grunt.option( 'clean' ) );
    } );

  grunt.registerTask( 'createXML', 'Write XML file with specific translations for sim',
    function() {
      createXML( grunt );
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
    'Pull all sibling repositories',
    function() {
      pullAll( grunt );
    } );

  grunt.registerTask( 'string-report',
    'After doing a build, reports on which strings are missing for each locale that was built.',
    function() {
      stringReport( grunt, pkg.name, FALLBACK_LOCAL );
    } );

  grunt.registerTask( 'generate-128-thumbnail', 'Generate 128x84 thumbnail', function() {
    generateThumbnails( grunt, pkg.name, 128, 84 );
  } );

  grunt.registerTask( 'generate-600-thumbnail', 'Generate 600x394 thumbnail', function() {
    generateThumbnails( grunt, pkg.name, 600, 394 );
  } );

  grunt.registerTask( 'generate-thumbnails', 'Generate thumbnails', [ 'generate-128-thumbnail', 'generate-600-thumbnail' ] );

  /*
   * Load tasks from grunt plugins that have been installed locally using npm.
   * Put these in package.json and run 'npm install' before running grunt.
   */
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
