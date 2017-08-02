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
/* eslint-env node */
'use strict';

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );

// 3rd-party packages
var _ = require( '../../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match

// PhET custom grunt tasks
var afterRequirejsBuild = require( '../../../chipper/js/grunt/afterRequirejsBuild' );
var requirejsBuild = require( '../../../chipper/js/grunt/requirejsBuild' );
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var commitsSince = require( '../../../chipper/js/grunt/commitsSince' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var deployProduction = require( '../../../chipper/js/grunt/deployProduction' );
var deployDev = require( '../../../chipper/js/grunt/deployDev' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var generateA11yViewHTML = require( '../../../chipper/js/grunt/generateA11yViewHTML' );
var generateCoverage = require( '../../../chipper/js/grunt/generateCoverage' );
var generateDevelopmentHTML = require( '../../../chipper/js/grunt/generateDevelopmentHTML' );
var generateDevelopmentColorsHTML = require( '../../../chipper/js/grunt/generateDevelopmentColorsHTML' );
var generateREADME = require( '../../../chipper/js/grunt/generateREADME' );
var generateThumbnails = require( '../../../chipper/js/grunt/generateThumbnails' );
var generateTwitterCard = require( '../../../chipper/js/grunt/generateTwitterCard' );
var lint = require( '../../../chipper/js/grunt/lint' );
var reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
var reportThirdParty = require( '../../../chipper/js/grunt/reportThirdParty' );
var getBuildConfig = require( '../../../chipper/js/grunt/getBuildConfig' );
var updateCopyrightDates = require( '../../../chipper/js/grunt/updateCopyrightDates' );
var updatePhETiOSite = require( '../../../chipper/js/grunt/updatePhETiOSite' );
var findDuplicates = require( '../../../chipper/js/grunt/findDuplicates' );
var wrapperBuild = require( '../../../chipper/js/grunt/wrapperBuild' );
var sortRequireStatements = require( '../../../chipper/js/grunt/sortRequireStatements' );
var insertRequireStatement = require( '../../../chipper/js/grunt/insertRequireStatement' );
var wrapperDeploy = require( '../../../chipper/js/grunt/wrapperDeploy' );
var bumpVersion = require( '../../../chipper/js/grunt/bumpVersion' );

module.exports = function( grunt ) {

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

  //---------------------------------------------------------------------------------------------------------------
  // Primary tasks
  //---------------------------------------------------------------------------------------------------------------

  // Default task ('grunt')

  if ( buildConfig.isWrapper ) {
    grunt.registerTask( 'default', 'Builds the PhET-iO Wrapper', [ 'build-wrapper' ] );
  }
  else {
    grunt.registerTask( 'default', 'Builds the English HTML', [ 'build' ] );
  }

  // Add the linting step as an pre-build step.  Can be skipped with --lint=false
  var optionalTasks = [];
  if ( grunt.option( 'lint' ) === false ) {

    // do nothing
  }
  else {
    optionalTasks.push( 'lint-all' );
  }

  var additionalTasks = [
    'clean',
    'requirejs-build',
    'after-requirejs-build'
  ];

  // Determine what the 'build' command will do, so that 'grunt build-js' is not needed.
  if ( !buildConfig.isJSOnly ) {
    grunt.registerTask( 'build',
      'Builds the simulation:\n' +
      'with no options, builds HTML for English only\n' +
      '--locales=* : all locales in strings/ directory\n' +
      '--locales=fr : French\n' +
      '--locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)\n' +
      '--localesRepo=$repo : all locales in another repository\'s strings/ directory, ignored if --locales is present\n' +
      '--brand=$brand : build a specific brand. Choices are phet, phet-io, adapted-from-phet (default)\n' +
      '--lint=false : skip the lint sub-task\n' +
      '--mangle=false : skip the mangling portion of UglifyJS2, and beautify the output\n' +
      '--uglify=false : skip the UglifyJS2 step altogether\n' +
      '--allHTML : (phet brand only) - Generate the _all.html file that contains information for all locales',
      optionalTasks.concat( additionalTasks )
    );
  }
  else {
    // Grunt task that builds only the JS (no HTML), for libraries like scenery
    // see https://github.com/phetsims/scenery/issues/567
    grunt.registerTask( 'build', 'Build only the JS, for scenery/kite/dot/sun/libraries',
      optionalTasks.concat( [ 'clean', 'requirejs-build' ] )
    );
  }

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build', 'generate-thumbnails', 'generate-twitter-card' ]
  );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask( 'update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates',
    function() {
      updateCopyrightDates( grunt, buildConfig );
    } );

  grunt.registerTask( 'deploy-production',
    'Invoke deployDev and then deploy a simulation to the production server.\n' +
    'Should be run AFTER grunt build since it uses the shas from dependencies.json in the build directory.\n' +
    'Deploys to the production server by default, but dev server can be used for testing by setting:\n' +
    '"productionServerURL": "https://ox-dev.colorado.edu" in build-local.json\n' +
    '--dryRun : if true, preconditions will be checked and the build server URL will be printed but build and deploy will not occur\n' +
    '--noDev : if true, deploy to production only, not spot as well. Useful for testing\n' +
    '--email : optionally enter an email to be notified if the build fails or succeeds (overrides buildServerNotifyEmail in build-locale.json)\n' +
    '--locales=* : all locales that have been published so far. NOTE: for sims published after 11/9/15, this is the ' +
    'default option, otherwise it must be explicitly passed to republish all translations.\n' +
    '--locales=fr : French\n' +
    '--locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)',
    function() {

      var done = grunt.task.current.async();

      deployUtil.checkForUncommittedChanges( grunt, function() {
        deployUtil.checkForUnpushedChanges( grunt, function() {
          deployUtil.verifyDependenciesCheckedOut( grunt, function() {
            if ( grunt.option( 'noDev' ) || grunt.option( 'dryRun' ) ) {
              deployUtil.commitAndPushDependenciesJSON( grunt, function() {
                deployProduction( grunt, buildConfig, done );
              } );
            }
            else {
              deployDev( grunt, buildConfig, function() {
                deployProduction( grunt, buildConfig, done );
              } );
            }
          } );
        } );
      } );
    } );

  if ( buildConfig.isWrapper ) {

    // dev deploy for a PhET-iO wrapper
    grunt.registerTask( 'deploy-dev', 'Deploy a PhET-iO wrapper to spot.', function() {
      wrapperDeploy( grunt, buildConfig );
    } );
  }
  else {

    // Normal dev deploy for a phet sim
    grunt.registerTask( 'deploy-dev',
      'Deploy a dev version to spot, or optionally to the server in your preferences file\n' +
      '--mkdir : set to true to create the sim dir and .htaccess file before copying the version directory\n' +
      '--test : set to true to disable commit and push, and SCP to a test directory on spot',
      function() {
        deployDev( grunt, buildConfig );
      }
    );
  }
  grunt.registerTask( 'deploy-rc',
    'Deploy a rc version to spot using the build server.\n' +
    'Behaves identically to grunt deploy-dev, except the sim is rebuilt and deployed from the build-server instead of locally.\n' +
    'This is useful to ensure that the rc version is built in the same environment as our production deploys\n' +
    '--dryRun : if true, preconditions will be checked and the build server URL will be printed but build and deploy will not occur',

    function() {
      grunt.option( 'noDev', true );
      grunt.option( 'option', 'rc' );

      var done = grunt.task.current.async();

      deployUtil.checkForUncommittedChanges( grunt, function() {
        deployUtil.checkForUnpushedChanges( grunt, function() {
          deployUtil.commitAndPushDependenciesJSON( grunt, function() {
            deployProduction( grunt, buildConfig, done );
          } );
        } );
      } );
    }
  );

  /**
   * Returns a function that lints the specified target.
   * @param {string} target 'dir'|'all'|'everything'
   * @returns {function}
   */
  var runLint = function( target ) {
    return function() {
      lint( grunt, target, buildConfig );
    };
  };
  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', runLint( 'dir' ) );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', runLint( 'all' ) );

  grunt.registerTask( 'lint-everything', 'lint all js files that are required to build this repository', runLint( 'everything' ) );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( grunt.file.exists( 'build' ) ) {
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );


  grunt.registerTask( 'requirejs-build',
    '(internal use only) Do the requirejs build step',
    function() {
      requirejsBuild( grunt, buildConfig );
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

  grunt.registerTask( 'bump-version',
    'Bumps the number after the last dot in the version\n' +
    'then commits and pushes', function() {
      bumpVersion( grunt );
    } );

  grunt.registerTask( 'deploy-next-dev', 'Bumps the version, commits, builds and deploys dev', [

    // Build & lint it to make sure there are no problems
    'build',

    // update the version number
    'bump-version',

    // Build it with the new version number
    'build',

    // deploy it
    'deploy-dev'
  ] );

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
    'Creates a report of third-party resources (code, images, audio, etc) used in the published PhET simulations by ' +
    'reading the license information in published HTML files on the PhET website. This task must be run from master.  ' +
    'After running this task, you must push sherpa/third-party-licenses.md.',
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

  grunt.registerTask( 'generate-twitter-card', 'Generate image for twitter summary card to be used on the website.',
    function() {
      var finished = _.after( 1, grunt.task.current.async() );
      generateTwitterCard( grunt, buildConfig.name, finished );
    } );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    function() {
      generateDevelopmentHTML( grunt, buildConfig );
    } );

  grunt.registerTask( 'generate-development-colors-html',
    'Generates top-level SIM-colors.html file used for testing color profiles and color values.',
    function() {
      generateDevelopmentColorsHTML( grunt, buildConfig );
    } );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content.',
    function() {
      generateA11yViewHTML( grunt, buildConfig );
    } );

  grunt.registerTask( 'generate-coverage',
    'Generates a code coverage report using Istanbul. See generateCoverage.js for details.',
    function() {
      generateCoverage( grunt, buildConfig );
    } );

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=\<date\> to specify the date.',
    function() {
      commitsSince( grunt, buildConfig );
    } );

  grunt.registerTask( 'update-phet-io-site',
    'Copy the phet-io-site docs and materials from phet-io/phet-io-site to phet-io-site',
    function() {
      updatePhETiOSite( grunt, buildConfig );
    } );

  grunt.registerTask( 'find-duplicates', 'Find duplicated code in this repo.\n' +
                                         '--dependencies to expand search to include dependencies\n' +
                                         '--everything to expand search to all PhET code', function() {
    findDuplicates( grunt, buildConfig );
  } );

  grunt.registerTask( 'wrapper-basic-build', 'Build PhET-iO wrapper', function() {
    wrapperBuild( grunt, buildConfig );
  } );

  grunt.registerTask( 'build-wrapper', 'Build PhET-iO wrapper', optionalTasks.concat( [ 'clean', 'wrapper-basic-build' ] ) );

  grunt.registerTask( 'sort-require-statements', 'Sort the require statements for all *.js files in the js/ directory. ' +
                                                 'This assumes the code is formatted  with IDEA code style and that ' +
                                                 'require statements take one line each (not split across lines).  The ' +
                                                 'files are overwritten.\n' +
                                                 '--file (optional) absolute path of a single file to sort', function() {
    sortRequireStatements( grunt, grunt.option( 'file' ) );
  } );

  grunt.registerTask( 'insert-require-statement', 'Insert a require statement into the specified file.\n' +
                                                  '--file absolute path of a single file to sort\n' +
                                                  '--name to be required', function() {
    insertRequireStatement( grunt, buildConfig );
  } );
};