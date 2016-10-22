// Copyright 2015, University of Colorado Boulder

/**
 * Deploy a simulation to spot.
 *
 * @author Aaron Davis
 */

// modules
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

// constants
var URL_BASE = 'http://www.colorado.edu/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var TEST_DIR_NAME = 'deploy-dev-tests';

/**
 * @param grunt - the grunt instance
 * @param callback - optional callback to run when finished, defaults to grunt.task.current.async()
 */
module.exports = function( grunt, callback ) {
  'use strict';

  // grunt options
  var mkdir = !!grunt.option( 'mkdir' ); // true = create the sim dir and .htaccess file before copying the version directory
  var test = !!grunt.option( 'test' ); // true = disable commit and push, and SCP to a test directory on spot

  // configuration info from external files
  var deployConfig = getDeployConfig( grunt, global.phet.chipper.fs );

  // get the server name and server path if they are in the preferences file, otherwise use defaults
  var server = deployConfig.devDeployServer;
  var basePath = deployConfig.devDeployPath;
  if ( test ) {
    basePath += TEST_DIR_NAME + '/';
    URL_BASE += TEST_DIR_NAME + '/';
  }

  // get the sim name and version
  var sim = deployConfig.name;
  var version = deployConfig.version;
  var simPath = basePath + sim;
  var versionPath = simPath + '/' + version;

  // If there is a protected directory and we are copying to spot, include the .htaccess file
  // This is for PhET-iO simulations, to protected the password protected wrappers, see
  // https://github.com/phetsims/phet-io/issues/641
  if ( grunt.file.isDir( ChipperConstants.BUILD_DIR ) && deployConfig.devDeployServer === 'spot.colorado.edu' ) {
    grunt.file.copy( '../phet-io/templates/spot/.htaccess', ChipperConstants.BUILD_DIR + '/wrappers/.htaccess' );
  }

  var done = callback || grunt.task.current.async();

  var finish = function() {
    grunt.log.writeln( 'deployed: ' + URL_BASE + sim + '/' + version + '/' + sim + '_en.html' );
    done();
  };

  /**
   * scp file to dev server, and call commitAndPushDependenciesJSON if not testing
   */
  var scp = function() {
    deployUtil.exec( grunt, 'scp -r ' + ChipperConstants.BUILD_DIR + ' ' + deployConfig.devUsername + '@' + server + ':' + versionPath, function() {
      if ( test ) {
        finish();
      }
      else {
        deployUtil.commitAndPushDependenciesJSON( grunt, finish );
      }
    } );
  };

  if ( mkdir ) {
    var sshString = 'ssh ' + deployConfig.devUsername + '@' + server;
    var mkdirAndCreateHtaccessCommand = ' \'mkdir -p ' + simPath + ' && echo "' + HTACCESS_TEXT + '" > ' + simPath + '/.htaccess\'';
    deployUtil.exec( grunt, sshString + mkdirAndCreateHtaccessCommand, scp );
  }
  else {
    scp();
  }
};
