// Copyright 2013-2015, University of Colorado Boulder

//TODO: should the parent project (the sim itself) also be checked out, ignored, or moved into its specified branch?  Right now it is ignored (i.e. left as it was when the task was started)
/**
 * This grunt task checks out the shas for a project, as specified in a dependencies.json file in its top level.
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

  var exec = function( command, args, callback){
    child_process.exec( command, args, function( error1, stdout1, stderr1 ) {
      grunt.log.writeln( stdout1 );
      grunt.log.writeln( stderr1 );
      callback( error1, stdout1, stderr1);
    } );
  };


  // This option should be used only by build-server, to indicate that the task was invoked from build-server.
  var buildServer = !!grunt.option( 'buildServer' );

  var dependencies = grunt.file.readJSON( ( buildServer ) ? '../chipper/js/build-server/tmp/dependencies.json' : 'dependencies.json' );
  var done = grunt.task.current.async();
  var numToCheckOut = 0;
  var numCheckedOut = 0;
  for ( var property in dependencies ) {
    if ( property !== 'comment' && property !== repositoryName ) {
      numToCheckOut++;
    }
  }

  for ( property in dependencies ) {
    if ( property !== 'comment' && property !== repositoryName && dependencies.hasOwnProperty( property ) ) {

      (function( property ) {

        assert( typeof( dependencies[ property ].branch !== 'undefined' ) && typeof( dependencies[ property ].sha !== 'undefined' ) );

        grunt.log.writeln( 'Checking out dependency ' + property + ': ' + dependencies[ property ].branch + '@' + dependencies[ property ].sha );

        //To execute something from a different directory:
        //cp.exec('foocommand', { cwd: 'path/to/dir/' }, callback);
        //http://stackoverflow.com/questions/14026967/calling-child-process-exec-in-node-as-though-it-was-executed-in-a-specific-folde
        var command = 'git checkout ' + ( toMaster ? 'master' : dependencies[ property ].sha );
        exec( command, { cwd: '../' + property }, function( error1 ) {
          assert( !error1, 'error in ' + command + ' for repo ' + property );
          grunt.log.writeln( 'Finished checkout.' );
          numCheckedOut = numCheckedOut + 1;
          if ( numToCheckOut === numCheckedOut ) {
            pruneAndUpdate();
          }
        } );
      })( property );
    }
  }

  // npm prune and npm update in current repo and in chipper
  var pruneAndUpdateRepo = function( repo, callback ){
    exec( 'npm prune', { cwd: '../' + repo }, function( error1 ) {
      assert( !error1, 'error in npm prune for repo ' + repo );
      grunt.log.writeln( 'Finished npm prune.');
      exec( 'npm update', { cwd: '../' + repo }, function( error1 ) {
        assert( !error1, 'error in npm update for repo ' + repo );
        grunt.log.writeln( 'Finished npm update.' );
        callback();
      } );
    } );
  };
  var pruneAndUpdate = function(){
    pruneAndUpdateRepo( repositoryName, function(){
      pruneAndUpdateRepo( 'chipper', function(){
        done();
      });
    });
  };


};