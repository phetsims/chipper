// Copyright 2002-2013, University of Colorado Boulder

var assert = require( 'assert' );
var child_process = require( 'child_process' );

/**
 * Check out the shas for a project as specified in a dependencies.json file in its top level.
 *
 * TODO: this is untested
 * TODO: should the parent project (the sim itself) also be checked out, ignored, or moved into its specified branch?  Right now it is ignored (i.e. left as it was when the task was started)
 * @param grunt
 * @param projectName
 */
module.exports = function( grunt, projectName ) {
  'use strict';
  var dependencies = grunt.file.readJSON( 'dependencies.json' );
  var done = grunt.task.current.async();
  var numToCheckOut = 0;
  var numCheckedOut = 0;
  for ( var property in dependencies ) {
    if ( property !== 'comment' && property !== projectName ) {
      numToCheckOut++;
    }
  }

  for ( property in dependencies ) {
    if ( property !== 'comment' && property !== projectName && dependencies.hasOwnProperty( property ) ) {

      (function( property ) {

        assert( typeof( dependencies[property].branch !== 'undefined' ) && typeof( dependencies[property].sha !== 'undefined' ) );

        console.log( "Checking out dependency " + property + ': ' + dependencies[property].branch + '@' + dependencies[property].sha );

        //To execute something from a different directory:
        //cp.exec('foocommand', { cwd: 'path/to/dir/' }, callback);
        //http://stackoverflow.com/questions/14026967/calling-child-process-exec-in-node-as-though-it-was-executed-in-a-specific-folde

        //Added an option to checkout master branch if you specify --tomaster=true
        var toMaster = grunt.option( "tomaster" ) && grunt.option( "tomaster" ) === true;
        var command = !toMaster ?
                      'git checkout ' + dependencies[property].sha :
                      'git checkout master';

        child_process.exec( command, {cwd: '../' + property}, function( error1, stdout1, stderr1 ) {
          assert( !error1, "error in " + command );
          console.log( 'Finished checkout.' );
          console.log( stdout1 );
          console.log( stderr1 );
          numCheckedOut = numCheckedOut + 1;
          if ( numToCheckOut === numCheckedOut ) {
            done();
          }
        } );
      })( property );
    }
  }
};