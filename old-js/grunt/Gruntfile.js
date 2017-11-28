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

// PhET custom grunt tasks
var bumpVersion = require( '../../../chipper/js/grunt/bumpVersion' );
var checkoutShas = require( '../../../chipper/js/grunt/checkoutShas' );
var commitsSince = require( '../../../chipper/js/grunt/commitsSince' );
var createSim = require( '../../../chipper/js/grunt/createSim' );
var deployDev = require( '../../../chipper/js/grunt/deployDev' );
var deployProduction = require( '../../../chipper/js/grunt/deployProduction' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var findDuplicates = require( '../../../chipper/js/grunt/findDuplicates' );
var getBuildConfig = require( '../../../chipper/js/grunt/getBuildConfig' );
var insertRequireStatement = require( '../../../chipper/js/grunt/insertRequireStatement' );
var reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
var reportThirdParty = require( '../../../chipper/js/grunt/reportThirdParty' );
var sortRequireStatements = require( '../../../chipper/js/grunt/sortRequireStatements' );
var updateCopyrightDates = require( '../../../chipper/js/grunt/updateCopyrightDates' );
var updatePhETiOSite = require( '../../../chipper/js/grunt/updatePhETiOSite' );
var wrapperBuild = require( '../../../chipper/js/grunt/wrapperBuild' );
var wrapperDeploy = require( '../../../chipper/js/grunt/wrapperDeploy' );

module.exports = function( grunt ) {

  //---------------------------------------------------------------------------------------------------------------
  // Configuration

  var buildConfig = getBuildConfig( grunt );

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

  grunt.registerTask( 'ensure-dev-version', 'Makes sure the version contains "dev", for internal use only.', function() {
    if ( buildConfig.version.indexOf( 'dev' ) === -1 ) {
      grunt.fail.fatal( 'cannot deploy-next-dev unless the version number is a dev version' );
    }
  } );

  grunt.registerTask( 'deploy-next-dev', 'Bumps the version, commits, builds and deploys dev', [

    // Make sure it is a dev version
    'ensure-dev-version',

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

  grunt.registerTask( 'sort-require-statements', 'Sort the require statements for all *.js files in the js/ directory. ' +
                                                 'This assumes the code is formatted  with IDEA code style and that ' +
                                                 'require statements take one line each (not split across lines).  The ' +
                                                 'files are overwritten.\n' +
                                                 '--file (optional) absolute path of a single file to sort', function() {
    sortRequireStatements( grunt, grunt.option( 'file' ) );
  } );

  grunt.registerTask( 'insert-require-statement', 'Insert a require statement into the specified file.\n' +
                                                  '--file absolute path of the file that will receive the require statement\n' +
                                                  '--name to be required', function() {
    insertRequireStatement( grunt, buildConfig );
  } );
};