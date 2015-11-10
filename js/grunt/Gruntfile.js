// Copyright 2013-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
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
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match

// PhET custom grunt tasks
var afterRequirejsBuild = require( '../../../chipper/js/grunt/afterRequirejsBuild' );
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var commitsSince = require( '../../../chipper/js/grunt/commitsSince' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var deployProduction = require( '../../../chipper/js/grunt/deployProduction' );
var deployDev = require( '../../../chipper/js/grunt/deployDev' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var generateREADME = require( '../../../chipper/js/grunt/generateREADME' );
var generateThumbnails = require( '../../../chipper/js/grunt/generateThumbnails' );
var reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
var reportThirdParty = require( '../../../chipper/js/grunt/reportThirdParty' );
var getBuildConfig = require( '../../../chipper/js/grunt/getBuildConfig' );
var getGruntConfig = require( '../../../chipper/js/grunt/getGruntConfig' );
var createTogetherFiles = require( '../../../chipper/js/grunt/createTogetherFiles' );
var updateCopyrightDates = require( '../../../chipper/js/grunt/updateCopyrightDates' );

module.exports = function( grunt ) {
  'use strict';

  // For eslint
  require( 'load-grunt-tasks' )( grunt );

  //---------------------------------------------------------------------------------------------------------------
  // Configuration

  var buildConfig = getBuildConfig( grunt );

  // Initialize and document all globals
  assert( !global.phet, 'global.phet already exists' );
  global.phet = {

    chipper: {

      // the grunt instance, for situations where we can't pass it as a function argument
      grunt: grunt,

      // for code that runs in both requirejs and build modes, and therefore doesn't have access to grunt.file
      fs: fs,

      // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
      getCacheBusterArgs: function() { return ''; },

      // media plugins populate this with license.json entries, see getLicenseEntry.js for format of entries
      licenseEntries: {},

      // use by media plugins, which don't have access to buildConfig
      brand: buildConfig.brand,

      // populated by mipmap.js
      mipmapsToBuild: [],

      // populated by string.js
      strings: {}
    }
  };

  // Initialize grunt
  grunt.initConfig( getGruntConfig( grunt, buildConfig.name, buildConfig.phetLibs ) );

  //---------------------------------------------------------------------------------------------------------------
  // Primary tasks
  //---------------------------------------------------------------------------------------------------------------

  // Default task ('grunt')

  grunt.registerTask( 'default', 'Builds the English HTML', [ 'build' ] );

  // Add the linting step as an pre-build step.  Can be skipped with --lint=false
  var optionalTasks = [];
  if ( grunt.option( 'lint' ) === false ) {

    // do nothing
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
    '--lint=false : skip the lint sub-task\n' +
    '--mangle=false : skip the mangling portion of UglifyJS2, and beautify the output\n' +
    '--uglify=false : skip the UglifyJS2 step altogether',
    optionalTasks.concat( [
      'clean',
      'requirejs:build',
      'after-requirejs-build',
      'create-together-files'
    ] )
  );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build', 'generate-thumbnails' ]
  );

  // This is a separate task in order to make it easy to iterate on dev examples, without
  // having to rebuild the simulation html
  grunt.registerTask( 'create-together-files', 'Generate example files for together, if the brand is phet-io', function() {
    if ( buildConfig.brand === 'phet-io' ) {
      createTogetherFiles( grunt, buildConfig );
    }
  } );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask( 'update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates',
    function() {
      updateCopyrightDates( grunt, buildConfig );
    } );

  grunt.registerTask( 'deploy-production',
    'Invoke deployDev and then deploy a simulation to the production server.\n' +
    'Should be run AFTER grunt build since it uses the shas from dependencies.json in the build directory.\n' +
    'Deploys to figaro by default, but simian can be used for testing by setting:\n' +
    '"productionServerName": "simian.colorado.edu" and "productionServerURL": "https://phet-dev.colorado.edu" in build-local.json\n' +
    '--noDev : if true, deploy to production only, not spot as well. Useful for testing\n' +
    '--email : optionally enter an email to be notified if the build fails or succeeds (overrides buildServerNotifyEmail in build-locale.json)\n' +
    '--locales=* : all locales that have been published so far. NOTE: for sims published after 11/9/15, this is the ' +
    'default option, otherwise it must be explicitly passed to republish all translations.\n' +
    '--locales=fr : French\n' +
    '--locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)',
    function() {
      // before invoking the build-server, do a dev deploy, including committing and pushing to github
      var done = grunt.task.current.async();
      if ( grunt.option( 'noDev' ) ) {
        deployProduction( grunt, done );
      }
      else {
        deployDev( grunt, function() {
          deployProduction( grunt, done );
        } );
      }
    }
  );

  grunt.registerTask( 'deploy-dev',
    'Deploy a dev version to spot, or optionally to the server in your preferences file\n' +
    '--mkdir : set to true to create the sim dir and .htaccess file before copying the version directory\n' +
    '--test : set to true to disable commit and push, and SCP to a test directory on spot',
    function() {
      deployDev( grunt );
    }
  );

  grunt.registerTask( 'deploy-rc',
    'Deploy a rc version to spot using the build server.\n' +
    'Behaves identically to grunt deploy-dev, except the sim is rebuilt and deployed from the build-server instead of locally.\n' +
    'This is useful to ensure that the rc version is built in the same environment as our production deploys',
    function() {
      grunt.option( 'noDev', true );
      grunt.option( 'option', 'rc' );

      var done = grunt.task.current.async();

      deployUtil.commitAndPush( grunt, function() {
        deployProduction( grunt, done );
      } );
    }
  );

  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', [ 'eslint:repoFiles' ] );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', [ 'eslint:allFiles' ] );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( grunt.file.exists( 'build' ) ) {
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );

  grunt.registerTask( 'after-requirejs-build',
    '(internal use only) Do things after the requirejs:build task',
    function() {
      afterRequirejsBuild( grunt, buildConfig );
    } );

  //---------------------------------------------------------------------------------------------------------------
  // Utility tasks
  //---------------------------------------------------------------------------------------------------------------

  grunt.registerTask( 'checkout-shas',
    'Check out shas for a project, as specified in dependencies.json',
    function() {
      checkoutShas( grunt, buildConfig.name, false /* toMaster */ );
    } );

  grunt.registerTask( 'checkout-master',
    'Check out master branch for all dependencies, as specified in dependencies.json',
    function() {
      checkoutShas( grunt, buildConfig.name, true /* toMaster */ );
    } );

  grunt.registerTask( 'create-sim',
    'Creates a sim based on the simula-rasa template.\n' +
    '--name="string" : the repository name\n' +
    '--author="string" : the author name\n' +
    '--title="string" : (optional) the simulation title\n' +
    '--clean=true : (optional) deletes the repository directory if it exists',
    function() {
      createSim( grunt );
    } );

  // See reportMedia.js
  grunt.registerTask( 'report-media',
    '(project-wide) Report on license.json files throughout all working copies. ' +
    'Reports any media (such as images or audio) files that have any of the following problems:\n' +
    '(1) incompatible-license (resource license not approved)\n' +
    '(2) not-annotated (license.json missing or entry missing from license.json)\n' +
    '(3) missing-file (entry in the license.json but not on the file system)',
    function() {
      reportMedia( grunt );
    } );

  // see reportThirdParty.js
  grunt.registerTask( 'report-third-party',
    'This task is used to create a report of third-party resources (code, ' +
    'images, audio, etc) used in a set of PhET simulations by reading the ' +
    'license information in built HTML files.\n' +
    '--input (required argument) the path to the directory containing HTML ' +
    'files which will be reported on.\n' +
    '--output (required argument) the path to a file where the report should be ' +
    'written. The file is in markdown syntax and the *.md suffix is ' +
    'recommended. This will silently overwrite an existing file, if there is ' +
    'one.\n' +
    '--active-runnables (optional, default to false) If true, ' +
    'the task iterates over the active-runnables and copies each ' +
    'built HTML file into the directory specified with --input before ' +
    'running the report. If any HTML files are missing, the report will fail. ' +
    'Before using this flag, the developer should run `grunt-all.sh` to make ' +
    'sure all of the HTML files are up-to-date. The directory is neither ' +
    'automatically created nor automatically cleaned, this is the ' +
    'responsibility of the developer. (Note that if you fail to manually ' +
    'clean the directory, you may end up with stale HTML files).',
    function() {
      reportThirdParty( grunt );
    } );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    function() {
      assert( buildConfig.simTitleStringKey, 'missing buildConfig.simTitleStringKey' );
      generateREADME( grunt, buildConfig.name, buildConfig.phetLibs, buildConfig.simTitleStringKey, true /* published */ );
    } );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    function() {
      assert( buildConfig.simTitleStringKey, 'missing buildConfig.simTitleStringKey' );
      generateREADME( grunt, buildConfig.name, buildConfig.phetLibs, buildConfig.simTitleStringKey, false /* published */ );
    } );

  grunt.registerTask( 'generate-thumbnails', 'Generate 128x84 and 600x394 thumbnails to be used on the website.',
    function() {
      var finished = _.after( 2, grunt.task.current.async() );
      generateThumbnails( grunt, buildConfig.name, 128, 84, finished );
      generateThumbnails( grunt, buildConfig.name, 600, 394, finished );
    } );

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=\<date\> to specify the date.',
    function() {
      commitsSince( grunt, buildConfig );
    } );

  /*
   * Load tasks from grunt plugins that have been installed locally using npm.
   * Put these in package.json and run 'npm install' before running grunt.
   */
  grunt.loadNpmTasks( 'grunt-requirejs' );
};
