// Copyright 2013-2015, University of Colorado Boulder

/**
 * This grunt task checks out the shas for a project, as specified in a dependencies.json file in its top level.
 * This grunt task will not checkout the parent repo (the sim itself), only its dependencies.
 */
/* eslint-env node */
'use strict';

var assert = require( 'assert' );
var child_process = require( 'child_process' );

/**
 * @param grunt - the grunt instance
 * @param {string} repositoryName - name of the repository
 * @param {boolean} toMaster - whether master should be used, or dependencies.json shas should be used
 */
module.exports = function( grunt, repositoryName, toMaster ) {

  var exec = function( command, args, callback ) {
    child_process.exec( command, args, function( error, stdout, stderr ) {
      grunt.log.writeln( stdout );
      grunt.log.writeln( stderr );
      callback( error, stdout, stderr );
    } );
  };


  // This option should be used only by build-server, to indicate that the task was invoked from build-server.
  var buildServer = !!grunt.option( 'buildServer' );

  var dependencies = grunt.file.readJSON( ( buildServer ) ? '../chipper/js/build-server/tmp/dependencies.json' : 'dependencies.json' );
  var done = grunt.task.current.async();
  var numCheckedOut = 0;
  var dependenciesToCheckOut = Object.keys( dependencies ).filter( function( repository ) {
    return repository !== repositoryName && repository !== 'comment';
  } );

  var numToCheckOut = dependenciesToCheckOut.length;


  // Iterate through each dependency and check out the correct branch
  dependenciesToCheckOut.forEach( function( dependencyName ) {
    assert( dependencies[ dependencyName ].branch && dependencies[ dependencyName ].sha );

    grunt.log.writeln( 'Checking out dependency ' + dependencyName + ': ' + dependencies[ dependencyName ].branch + '@' + dependencies[ dependencyName ].sha );

    // To execute something from a different directory:
    // cp.exec( 'foocommand', { cwd: 'path/to/dir/' }, callback);
    // http://stackoverflow.com/questions/14026967/calling-child-process-exec-in-node-as-though-it-was-executed-in-a-specific-folde
    var command = 'git checkout ' + ( toMaster ? 'master' : dependencies[ dependencyName ].sha );
    exec( command, { cwd: '../' + dependencyName }, function( error1 ) {
      assert( !error1, 'error in ' + command + ' for repo ' + dependencyName );
      grunt.log.writeln( 'Finished checkout.' );
      numCheckedOut++;
      if ( numToCheckOut === numCheckedOut ) {
        pruneAndUpdate();
      }
    } );
  } );


  // npm prune and npm update in current repo and in chipper
  var pruneAndUpdateRepo = function( repo, callback ) {
    exec( 'npm prune', { cwd: '../' + repo }, function( error1 ) {
      assert( !error1, 'error in npm prune for repo ' + repo );
      grunt.log.writeln( 'Finished npm prune for repo ' + repo );
      exec( 'npm update', { cwd: '../' + repo }, function( error1 ) {
        assert( !error1, 'error in npm update for repo ' + repo );
        grunt.log.writeln( 'Finished npm update for repo ' + repo );
        callback();
      } );
    } );
  };
  var pruneAndUpdate = function() {
    pruneAndUpdateRepo( repositoryName, function() {
      pruneAndUpdateRepo( 'chipper', function() {
        done();
      } );
    } );
  };


};