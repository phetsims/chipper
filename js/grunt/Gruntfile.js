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

// use process.env
/* jslint node: true */

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
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var deploySimulation = require( '../../../chipper/js/grunt/deploySimulation' );
var deployDev = require( '../../../chipper/js/grunt/deployDev' );
var generateREADME = require( '../../../chipper/js/grunt/generateREADME' );
var generateThumbnails = require( '../../../chipper/js/grunt/generateThumbnails' );
var reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
var reportThirdParty = require( '../../../chipper/js/grunt/reportThirdParty' );

//TODO look at why this is necessary
/*
 * In Node, global is the global namespace object.
 * Register fs as a global so it can be accessed through the requirejs build system. Text.js plugin
 * may have a superior way to handle this but I (SR) couldn't get it working after a small amount of effort.
 */
global.fs = fs;

module.exports = function( grunt ) {
  'use strict';

  // for sharing global information
  global.phet = global.phet || {};
  global.phet.chipper = global.phet.chipper || {};

  // for situations where we can't pass the grunt instance as a function argument
  global.phet.chipper.grunt = grunt;

  var FALLBACK_LOCAL = 'en';

  // read the preferences file
  var PREFERENCES_FILE = process.env.HOME + '/.phet/build-local.json';
  var preferences = {};
  if ( fs.existsSync( PREFERENCES_FILE ) ) {
    preferences = grunt.file.readJSON( PREFERENCES_FILE );
  }

  /**
   * Gets the name of brand to use, which determines which logo to show in the navbar as well as what options
   * to show in the PhET menu and what text to show in the About dialog.
   * See also the requirejs-time version of this function (which uses query-parameters) in initialize-globals.js
   * See https://github.com/phetsims/brand/issues/11
   * @returns {string}
   */
  global.phet.chipper.brand = grunt.option( 'brand' ) || preferences.brand || 'adapted-from-phet';
  assert( fs.existsSync( '../brand/' + global.phet.chipper.brand ), 'no such brand: ' + global.phet.chipper.brand );

  // Read package.json, verify that it contains properties required by all PhET repositories
  assert( fs.existsSync( 'package.json' ), 'repository must have a package.json' );
  var pkg = grunt.file.readJSON( 'package.json' );
  assert( pkg.name, 'name missing from package.json' );
  assert( pkg.version, 'version missing from package.json' );
  assert( pkg.license, 'license missing from package.json' );

  // For sims, read common phetLibs from chipper/build.json. We'll do this here since several grunt tasks (including some utilities) need phetLibs.
  assert( fs.existsSync( '../chipper/build.json' ), 'missing build.json' );
  var buildInfo = grunt.file.readJSON( '../chipper/build.json' );

  // Add phetLibs from build-local.json
  pkg.phetLibs = pkg.phetLibs || [];
  pkg.phetLibs = _.uniq( pkg.phetLibs.concat( buildInfo.common.phetLibs ).sort() );
  grunt.log.debug( 'phetLibs = ' + pkg.phetLibs );

  // TODO: As a temporary means of keeping track of "together" versions, replace "-dev" with "-together" in the version
  // string. This approach has a lot of problems and should be replaced as soon as we work out a more all encompassing
  // way of tracking together-enhanced versions.  See https://github.com/phetsims/special-ops/issues/3 for more info.
  if ( global.phet.chipper.brand === 'phet-io' && pkg.version.indexOf( '-dev' ) > -1 ) {
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

  // Enumerate the list of files to be linted for the jshint:allFiles task
  var allFilesToLint = _.map( pkg.phetLibs, function( repo ) {
    return '../' + repo + '/js/**/*.js';
  } );

  // The brand repo has a different structure, so add it explicitly
  allFilesToLint.push( '../brand/*/js/**/*.js' );

  // Don't try to lint the svgPath.js.  It was automatically generated and doesn't match convention
  allFilesToLint.push( '!../kite/js/parser/svgPath.js' );

  // Identify the repo files to lint for the single repo.
  // The brand repo is a special case since it has nested subdirectories instead of a top level js/ directory
  var repoFilesToLint = ( pkg.name === 'brand' ) ? [ '*/js/**/*.js' ] : [ 'js/**/*.js' ];

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
      repoFiles: repoFilesToLint,

      // All source files for this repository (repository-specific and dependencies).
      // Excludes kite/js/parser/svgPath.js, which is auto-generated.
      allFiles: allFilesToLint,

      // reference external JSHint options in jshintOptions.js
      options: require( './jshintOptions' )
    }
  } );

  //---------------------------------------------------------------------------------------------------------------
  // Primary tasks
  //---------------------------------------------------------------------------------------------------------------

  // Default task ('grunt')

  grunt.registerTask( 'default', 'Builds the English HTML', [ 'build' ] );

  // Add the linting step as an pre-build step.  Can be skipped with --lint=false
  var optionalTasks = [];
  if ( grunt.option( 'lint' ) === false ) {
  }
  else {
    optionalTasks.push( 'lint-all' );
  }

  grunt.registerTask( 'build',
    'Builds the simulation:\n' +
    'with no options, builds HTML for English only\n' +
    '--locales=* : all locales in strings/ directory\n' +
    '--locales=fr : French\n' +
    '--locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)\n' +
    '--localesRepo=$repo : all locales in another repository\'s strings/ directory, ignored if --locales is present\n' +
    '--lint=false : skip the lint sub-task',
    optionalTasks.concat( [
      'clean',
      'before-requirejs-build',
      'requirejs:build',
      'after-requirejs-build' ] )
  );

  grunt.registerTask( 'deploy-production',
    'Deploy a simulation. Should be run AFTER grunt build since it uses the shas from dependencies.json in the build directory.\n' +
    'with no options, deploys to phet-dev (since this is still being tested)\n' +
    '--devDeploy : deploys to spot',
    function() {
      deploySimulation( grunt, grunt.option( 'devDeploy' ) );
    }
  );

  grunt.registerTask( 'deploy-dev',
    'Deploy a dev version to spot, or optionally to the server in your preferences file\n' +
    '--buildServer : build the sim with the build server if true\n' +
    '--mkdir : set to true to create the sim dir and .htaccess file before copying the version directory\n' +
    '--test : set to true to disable commit and push, and SCP to a test directory on spot',
    function() {
      if ( grunt.option( 'buildServer' ) ) {
        deploySimulation( grunt, 'simian' );
      }
      else {
        deployDev( grunt, grunt.option( 'mkdir' ), grunt.option( 'test' ) );
      }
    }
  );

  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', [ 'jshint:repoFiles' ] );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', [ 'jshint:allFiles' ] );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( fs.existsSync( 'build' ) ) {
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );

  grunt.registerTask( 'before-requirejs-build', '(internal use only) Do things before the requirejs:build task',
    function() {
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

  // See reportMedia.js
  grunt.registerTask( 'report-media', '(project-wide) Report on license.json files throughout all working copies. ' +
                                      'Reports any media (such as images or audio) files that have any of the following problems:\n' +
                                      '(1) incompatible-license (resource license not approved)\n' +
                                      '(2) not-annotated (license.json missing or entry missing from license.json)\n' +
                                      '(3) missing-file (entry in the license.json but not on the file system)',
    function() {
      reportMedia( grunt );
    } );

  // see reportThirdParty.js
  grunt.registerTask( 'report-third-party', 'This task is used to create a report of third-party resources (code, ' +
                                            'images, audio, etc) used in a set of PhET simulations by reading the ' +
                                            'license information in built HTML files.\n' +
                                            '--input (required argument) the path to the directory containing HTML ' +
                                            'files which will be reported on.\n' +
                                            '--output (required argument) the path to a file where the report should be ' +
                                            'written. The file is in markdown syntax and the *.md suffix is ' +
                                            'recommended. This will silently overwrite an existing file, if there is ' +
                                            'one.\n' +
                                            '--active-runnables (optional flag, boolean) If this flag is ' +
                                            'supplied, the task iterates over the active-runnables and copies each ' +
                                            'built HTML file into the directory specified with --input before ' +
                                            'running the report. If any HTML files are missing, the report will fail. ' +
                                            'Before using this flag, the developer should run `grunt-all.sh` to make ' +
                                            'sure all of the HTML files are up-to-date. The directory is neither ' +
                                            'automatically created nor automatically cleaned, this is the ' +
                                            'responsibility of the developer. (Note that if you fail to manually ' +
                                            'clean the directory, you may end up with stale HTML files).',
    function() {

      // The input and output arguments are required but we chose not to use the grunt required argument syntax (a colon)
      // since it would cause problems for Windows developers who have colons in the pathnames.
      var input = grunt.option( 'input' );
      var output = grunt.option( 'output' );
      assert( input, 'The input path must be specified' );
      assert( output, 'The output path must be specified' );

      var activeRunnables = !!grunt.option( 'active-runnables' );
      reportThirdParty( grunt, input, output, activeRunnables );
    } );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    function() {
      assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' );
      generateREADME( grunt, pkg.name, pkg.phetLibs, pkg.simTitleStringKey, true /* published */ );
    } );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    function() {
      assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' );
      generateREADME( grunt, pkg.name, pkg.phetLibs, pkg.simTitleStringKey, false /* published */ );
    } );

  grunt.registerTask( 'generate-thumbnails', 'Generate 128x84 and 600x394 thumbnails to be used on the website.',
    function() {
      var finished = _.after( 2, grunt.task.current.async() );
      generateThumbnails( grunt, pkg.name, 128, 84, finished );
      generateThumbnails( grunt, pkg.name, 600, 394, finished );
    } );

  /*
   * Load tasks from grunt plugins that have been installed locally using npm.
   * Put these in package.json and run 'npm install' before running grunt.
   */
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
