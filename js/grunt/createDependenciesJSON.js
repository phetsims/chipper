// Copyright 2002-2015, University of Colorado Boulder

/**
 * Gets shas and branch names for all dependencies and creates:
 * - the dependencies.json file that is written to the build directory (excludes babel)
 * - the dependences JSON data structure that is embedded in the HTML file (includes babel)
 *
 * This is one step in the 'after-requirejs-build' task.
 * See afterRequirejsBuild.js for documentation on how this step fits into that asynchronous task.
 */

// built-in node APIs
var assert = require( 'assert' );
var child_process = require( 'child_process' );

// 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// modules
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 * @param {function} callback - called when this step is completed
 */
module.exports = function( grunt, buildConfig, callback ) {
  'use strict';

  var phetLibsCopy = _.clone( buildConfig.phetLibs ); // clone because we'll be modifying this array
  grunt.log.debug( 'Scanning dependencies from:\n' + phetLibsCopy.toString() );

  var dependenciesInfo = {
    comment: '# ' + buildConfig.name + ' ' + buildConfig.version + ' ' + (new Date().toString())
  };

  function nextDependency() {
    if ( phetLibsCopy.length > 0 ) {

      var dependency = phetLibsCopy.shift(); // remove first item
      assert( !dependenciesInfo.dependency, 'there was already a dependency named ' + dependency );

      // get the SHA: git --git-dir ../scenery/.git rev-parse HEAD
      child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse HEAD', function( error, stdout, stderr ) {
        assert( !error, error ? ( 'ERROR on git SHA attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

        var sha = stdout.trim();

        // get the branch: git --git-dir ../scenery/.git rev-parse --abbrev-ref HEAD
        child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse --abbrev-ref HEAD', function( error, stdout, stderr ) {
          assert( !error, error ? ( 'ERROR on git branch attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

          var branch = stdout.trim();

          grunt.log.debug( ChipperStringUtils.padString( dependency, 20 ) + branch + ' ' + sha );
          dependenciesInfo[ dependency ] = { sha: sha, branch: branch };

          nextDependency();
        } );
      } );
    }
    else {

      // Remove 'babel' (string repo) from the dependencies that are written to dependencies.json,
      // since different builds can have different babel SHAs.
      var dependenciesInfoWithoutBabel = _.omit( dependenciesInfo, 'babel' );
      grunt.file.write( 'build/dependencies.json', JSON.stringify( dependenciesInfoWithoutBabel, null, 2 ) + '\n' );

      // Pass the complete dependencies (including 'babel') to the next step.
      callback( JSON.stringify( dependenciesInfo, null, 2 ) );
    }
  }

  nextDependency();
};
