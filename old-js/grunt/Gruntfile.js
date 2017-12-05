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
var deployDev = require( '../../../chipper/js/grunt/deployDev' );
var deployProduction = require( '../../../chipper/js/grunt/deployProduction' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var getBuildConfig = require( '../../../chipper/js/grunt/getBuildConfig' );
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

  grunt.registerTask( 'update-phet-io-site',
    'Copy the phet-io-site docs and materials from phet-io/phet-io-site to phet-io-site',
    function() {
      updatePhETiOSite( grunt, buildConfig );
    } );

  grunt.registerTask( 'wrapper-basic-build', 'Build PhET-iO wrapper', function() {
    wrapperBuild( grunt, buildConfig );
  } );
};