// Copyright 2002-2015, University of Colorado Boulder

/**
 * Prints commits since a specified date, for all dependencies of the build target.
 * The output is grouped by repository, and condensed to one line per commit.
 *
 * For example, to see all commits since Oct 1, 2015 at 3:52pm:
 * grunt commits-since --date="2015-10-01 15:52"
 *
 * To count the number of commits, use the power of the shell:
 * grunt commits-since --date="2015-10-01 15:52" | grep -v since | wc -l
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

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
