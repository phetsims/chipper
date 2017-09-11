// Copyright 2015, University of Colorado Boulder

/**
 * Deploy a simulation to spot.
 *
 * @author Aaron Davis
 */
/* eslint-env node */
'use strict';

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var deployUtil = require( '../../../chipper/js/grunt/deployUtil' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );

// constants
var URL_BASE = 'http://www.colorado.edu/physics/phet/dev/html/';
var HTACCESS_TEXT = 'IndexOrderDefault Descending Date\n';
var TEST_DIR_NAME = 'deploy-dev-tests';

/**
 * @param grunt - the grunt instance
 * @param buildConfig
 * @param callback - optional callback to run when finished, defaults to grunt.task.current.async()
 */
module.exports = function( grunt, buildConfig, callback ) {

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
  if ( buildConfig.brand === 'phet-io' && grunt.file.isDir( ChipperConstants.BUILD_DIR ) &&
       deployConfig.devDeployServer === 'spot.colorado.edu' ) {
    grunt.file.copy( '../phet-io/templates/spot/.htaccess', ChipperConstants.BUILD_DIR + '/wrappers/.htaccess' );
  }

  var done = callback || grunt.task.current.async();

  var finish = function() {
    var finishedMessage = 'deployed: ' + URL_BASE + sim + '/' + version + '/';

    if ( grunt.option( 'brand' ) === 'phet-io' ) {
      grunt.log.writeln( finishedMessage + 'wrappers/index' );
    }
    else {
      grunt.log.writeln( finishedMessage + sim + '_en.html' );
    }
    done();
  };

  /**
   * scp file to dev server, and call commitAndPushDependenciesJSON if not testing
   */
  var scp = function() {
    // Check if directory exists
    deployUtil.exec( grunt, 'ssh ' + deployConfig.devUsername + '@' + server + ' \'file ' + versionPath + '\'', function( err, stdout, stderr ) {
      // If the directory does not exist proceed
      if ( stdout.indexOf( 'No such file or directory' ) >= 0 ) {
        // create remote version directory if it does not exist
        deployUtil.exec( grunt, 'ssh ' + deployConfig.devUsername + '@' + server + ' \'mkdir -p ' + versionPath + '\'', function() {
          // add group write permissions to the remote version directory if they don't exist
          deployUtil.exec( grunt, 'ssh ' + deployConfig.devUsername + '@' + server + ' \'chmod -R g+w ' + versionPath + '\'', function() {
            // copy the local build directory contents to the remote version directory
            deployUtil.exec( grunt, 'scp -r ' + ChipperConstants.BUILD_DIR + '/* ' + deployConfig.devUsername + '@' + server + ':' + versionPath, function() {
              if ( test ) {
                finish();
              }
              else {
                deployUtil.commitAndPushDependenciesJSON( grunt, finish );
              }
            } );
          } );
        } );
      }
      // If the directory does exist then bail
      else {
        grunt.fail.fatal( 'Directory ' + server + ':' + versionPath + ' already exists.  If you intend to replace the content then remove the directory manually from ' + server + '.' );
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
