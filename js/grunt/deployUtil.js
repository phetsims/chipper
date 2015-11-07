// Copyright 2015, University of Colorado Boulder

/**
 * Functions used for in multiple locations related to deploying.
 *
 * @author Aaron Davis
 */

/* jslint node: true */

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
  
  grunt.log.writeln( 'Running command: ' + command );
  child_process.exec( command, function( err, stdout, stderr ) {
    grunt.log.writeln( stdout );
    grunt.log.writeln( stderr );
    callback();
  } );
};

/**
 * Copy dependencies.json to sim root, commit, and push
 * @param grunt
 * @param callback
 */
var commitAndPush = function( grunt, callback ) {
  'use strict';
  
  grunt.file.copy( ChipperConstants.BUILD_DIR + '/' + DEPENDENCIES_JSON, DEPENDENCIES_JSON );
  exec( grunt, 'git add ' + DEPENDENCIES_JSON, function() {
    var version = getDeployConfig( global.phet.chipper.fs ).version;
    exec( grunt, 'git commit --message "updated ' + DEPENDENCIES_JSON + ' for ' + version + ' "', function() {
      exec( grunt, 'git push', callback );
    } );
  } );
};

module.exports = {
  commitAndPush: commitAndPush,
  exec: exec
};
