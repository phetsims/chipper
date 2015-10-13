// Copyright 2002-2015, University of Colorado Boulder

// built-in node APIs
var assert = require( 'assert' );
var child_process = require( 'child_process' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Tell grunt to wait because this task is asynchronous.
  // Returns a handle to a function that must be called when the task has completed.
  var done = grunt.task.current.async();

  var repositories = [ buildConfig.name ];
  repositories = repositories.concat( buildConfig.phetLibs );

  var dateString = grunt.option( 'date' );
  assert( dateString, 'missing required option: --date=\<date\>' );

  var output = ''; // accumulate output here

  function nextRepository() {

    if ( repositories.length > 0 ) {

      // remove first repository from the list
      var repository = repositories.shift();
      output += ( repository + ' since ' + dateString + ' ***************************************************\n' );

      // 'git log' command
      child_process.exec(
        'git --git-dir ../' + repository + '/.git log --since="' + dateString + '" --pretty=oneline',
        function( error, stdout, stderr ) {
          assert( !error, 'ERROR on git log attempt: ' + stderr );
          output += stdout;
          nextRepository();
        } );
    }
    else {
      grunt.log.writeln( output );
      done();
    }
  }

  nextRepository();
};
