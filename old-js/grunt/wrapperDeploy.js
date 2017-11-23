// Copyright 2015, University of Colorado Boulder

/**
 * This (asynchronous) grunt task builds and minifies an individual wrapper.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );

// constants
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';


/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // grunt options
  var mkdir = !!grunt.option( 'mkdir' ); // true = create the wrapper dir and .htaccess file before copying the version directory
  var test = !!grunt.option( 'test' ); // true = disable commit and push, and SCP to a test directory on spot


  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();


  // configuration info from external files
  var deployConfig = getDeployConfig( grunt, global.phet.chipper.fs );

  // get the server name and server path if they are in the preferences file, otherwise use defaults
  var server = deployConfig.wrapperDeployServer;
  var basePath = deployConfig.wrapperDeployPath;

  // get the sim name and version
  var wrapper = deployConfig.name;
  var version = deployConfig.version;
  var wrapperPath = basePath + wrapper;
  var versionPath = wrapperPath + '/' + version;


  /**
   * scp file to wrapper server, and call commitAndPushDependenciesJSON if not testing
   */
  var scp = function() {
    // Check if directory exists
    deployUtil.exec( grunt, 'ssh ' + deployConfig.wrapperUsername + '@' + server + ' \'file ' + versionPath + '\'', function( err, stdout, stderr ) {
      // If the directory does not exist proceed
      if ( stdout.indexOf('No such file or directory') >= 0 ) {
        // create remote version directory if it does not exist
        deployUtil.exec( grunt, 'ssh ' + deployConfig.wrapperUsername + '@' + server + ' \'mkdir -p ' + versionPath + '\'', function() {
          // add group write permissions to the remote version directory if they don't exist
          deployUtil.exec( grunt, 'ssh ' + deployConfig.wrapperUsername + '@' + server + ' \'chmod -R g+w ' + versionPath + '\'', function() {
            // copy the local build directory contents to the remote version directory
            deployUtil.exec( grunt, 'scp -r ' + ChipperConstants.BUILD_DIR + '/* ' + deployConfig.wrapperUsername + '@' + server + ':' + versionPath, function() {
              if ( test ) {
                done();
              }
              else {
                deployUtil.commitAndPushDependenciesJSON( grunt, done );
              }
            } );
          } );
        } );
      }
      // If the directory does exist then bail
      else {
        grunt.fail.fatal('Directory ' + server + ':' + versionPath + ' already exists.  If you intend to replace the content then remove the directory manually from ' + server + '.' );
      }
    } );
  };

  if ( mkdir ) {
    var sshString = 'ssh ' + deployConfig.wrapperUsername + '@' + server;
    var mkdirAndCreateHtaccessCommand = ' \'mkdir -p ' + wrapperPath + ' && echo "' + HTACCESS_TEXT + '" > ' + wrapperPath + '/.htaccess\'';
    deployUtil.exec( grunt, sshString + mkdirAndCreateHtaccessCommand, scp );
  }
  else {
    scp();
  }
};
