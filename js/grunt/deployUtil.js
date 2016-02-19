// Copyright 2015, University of Colorado Boulder

/**
 * Functions used for in multiple locations related to deploying.
 *
 * @author Aaron Davis
 * @author John Blanco
 */

/* jslint node: true */
var assert = require( 'assert' );
var child_process = require( 'child_process' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );

// constants
var DEPENDENCIES_JSON = 'dependencies.json';

/**
 * Exec a command, log stdout and stderr, handle errors
 * @param grunt
 * @param command
 * @param callback
 */
var exec = function( grunt, command, callback ) {
  'use strict';

  grunt.log.debug( 'Running command: ' + command );
  child_process.exec( command, function( err, stdout, stderr ) {
    grunt.log.debug( stdout );
    grunt.log.debug( stderr );
    callback();
  } );
};

/**
 * Copy the dependencies file to sim root, commit, and push
 * @param grunt
 * @param callback
 */
var commitAndPushDependenciesJSON = function( grunt, callback ) {
  'use strict';

  if ( !grunt.option( 'dryRun' ) ){
    grunt.file.copy( ChipperConstants.BUILD_DIR + '/' + DEPENDENCIES_JSON, DEPENDENCIES_JSON );
    exec( grunt, 'git add ' + DEPENDENCIES_JSON, function() {
      var version = getDeployConfig( global.phet.chipper.fs ).version;
      exec( grunt, 'git commit --message "updated ' + DEPENDENCIES_JSON + ' for ' + version + ' "', function() {
        exec( grunt, 'git push', callback );
      } );
    } );
  }
  else{
    grunt.log.writeln( 'Option \'dryRun\' set, skipping commit and push of dependencies.' );
    callback();
  }
};

/**
 * Check for working copy changes in all dependencies, fails if any are found unless the --force option is in use. This
 * is generally used to prevent erroneous deployments of release candidate or production builds.
 * @param grunt
 * @param callback
 */
var checkForUncommittedChanges = function( grunt, callback ) {
  'use strict';

  var dependencies = grunt.file.readJSON( DEPENDENCIES_JSON );
  var dependenciesList = [];

  // make the list of dependencies, including the main sim repo
  for ( var property in dependencies ) {
    if ( dependencies.hasOwnProperty( property ) && property !== 'comment' ) {
      dependenciesList.push( property );
    }
  }

  var gitCheckForChangedFilesCommand = 'git diff-files';
  grunt.log.debug( 'Checking for working copy changes on all dependencies...' );

  // define a function to check the next dependency on list, invoke it immediately to kick things off
  (function checkNextDependencyForChanges() {
    var dependency = dependenciesList.shift();
    if ( dependency ) {
      grunt.log.debug( 'Checking for working copy changes in repo', dependency + '...' );
      grunt.log.debug( 'Running command: ' + gitCheckForChangedFilesCommand );
      child_process.exec( gitCheckForChangedFilesCommand, { cwd: '../' + dependency }, function( err, stdout, stderr ) {
        assert( !err, 'error in ' + gitCheckForChangedFilesCommand + ' for repo ' + dependency );
        if ( stdout.length > 0 ) {
          // fail (unless --force option is present)
          grunt.fail.warn( 'Working copy changes exist in repo ' + dependency + '.' );
        }
        else{
          grunt.log.debug( 'No uncommitted changes exist.' );
        }
        checkNextDependencyForChanges();
      } );
    }
    else {
      // all repos verified, invoke the callback
      callback();
    }
  })();
};

/**
 * Check for unpushed changes in all dependencies, fails if any are found unless the --force option is in use. This is
 * generally used to prevent erroneous deployments of release candidate or production builds.
 * @param grunt
 * @param callback
 */
var checkForUnpushedChanges = function( grunt, callback ) {
  'use strict';

  var dependencies = grunt.file.readJSON( DEPENDENCIES_JSON );
  var dependenciesList = [];

  // make the list of dependencies, including the main sim repo
  for ( var property in dependencies ) {
    if ( dependencies.hasOwnProperty( property ) && property !== 'comment' ) {
      dependenciesList.push( property );
    }
  }

  var getCurrentShaCommand = 'git rev-parse HEAD';
  grunt.log.debug( 'Checking for unpushed changes on all dependencies...' );

  // define a function to check the next dependency on the list, invoke it immediately to kick things off
  (function checkNextDependencyForUnpushedChanges() {
    var dependency = dependenciesList.shift();
    if ( dependency ) {
      grunt.log.debug( 'Checking for unpushed changes for repo', dependency + '...' );
      grunt.log.debug( 'Obtaining current SHA by running command: ' + getCurrentShaCommand );

      // invoke a child process to get the current local SHA
      child_process.exec( getCurrentShaCommand, { cwd: '../' + dependency }, function( err, stdout, stderr ) {
        assert( !err, 'error in ' + getCurrentShaCommand + ' for repo ' + dependency );
        grunt.log.debug( 'current SHA = ' + stdout );
        var checkIfShaOnRemoteCommand = 'git branch -r --contains ' + stdout;
        grunt.log.debug( 'Checking if SHA exists on remote by running command: ' + checkIfShaOnRemoteCommand );

        // invoke a child process to see if SHA exists on remote
        child_process.exec( checkIfShaOnRemoteCommand + stdout, { cwd: '../' + dependency }, function( err, stdout, stderr ) {

          // TODO: Delete the following line
          grunt.log.debug( 'stdout: ' + stdout );


          // the git command lists the branches on which the commit exists, so if it's empty, the commit has not been pushed
          if ( stdout.length === 0 ) {
            grunt.fail.warn('Unpushed changes exist for repo ' + dependency + '.' );
          }
          else{
            grunt.log.debug( 'No unpushed changes exist for repo ' + dependency + '.' );
          }
          checkNextDependencyForUnpushedChanges();
        } );
      } );
    }
    else {
      // all repos verified, invoke the callback
      callback();
    }
  })();
};

/**
 * verify that the checked out dependencies match those specified in the dependencies file
 * @param grunt
 * @param callback
 */
var verifyDependenciesCheckedOut = function( grunt, callback ) {
  'use strict';

  grunt.log.debug( 'verifying that correct dependencies are checked out' );

  var deployConfig = getDeployConfig( global.phet.chipper.fs );
  var dependencies = grunt.file.readJSON( DEPENDENCIES_JSON );
  var dependenciesList = [];

  // make the list of dependencies
  for ( var property in dependencies ) {
    if ( dependencies.hasOwnProperty( property ) && property !== 'comment' && property !== deployConfig.name ) {
      dependenciesList.push( { repository: property, sha: dependencies[ property ].sha } );
    }
  }

  var getCurrentShaCommand = 'git rev-parse HEAD';

  // define a function to check the next dependency on list
  (function checkNextDependency(){
    var dependency = dependenciesList.shift();
    if ( dependency ) {
      grunt.log.debug( 'Running command: ' + getCurrentShaCommand );
      child_process.exec( getCurrentShaCommand, { cwd: '../' + dependency.repository }, function( err, stdout, stderr ) {
        assert( !err, 'error in ' + getCurrentShaCommand + ' for repo ' + dependency.repository );
        grunt.log.debug( 'repo ' + dependency.repository + ' current SHA = ' + stdout );

        // stdout should contain the current SHA, see if it matches what is specified
        if ( stdout.indexOf( dependency.sha ) === -1 ) {

          // SHA for repo doesn't match what was in the dependency list
          grunt.fail.warn( 'repo ' + dependency.repository + ' is not at correct SHA, expected ' + dependency.sha + ', found ' + stdout + '.' );
        }
        checkNextDependency();
      } );
    }
    else {
      // all repos verified, invoke the callback
      callback();
    }
  })();
};

module.exports = {
  checkForUnpushedChanges: checkForUnpushedChanges,
  commitAndPushDependenciesJSON: commitAndPushDependenciesJSON,
  verifyDependenciesCheckedOut: verifyDependenciesCheckedOut,
  checkForUncommittedChanges: checkForUncommittedChanges,
  exec: exec
};
