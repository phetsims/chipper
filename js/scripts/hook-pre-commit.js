// Copyright 2022-2023, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.  Avoids the overhead of grunt and Gruntfile.js for speed.
 *
 * Should only be run when developing in master, because when dependency shas are checked out for one sim,
 * they will likely be inconsistent for other repos which would cause failures for processes like type checking.
 * This means when running maintenance release steps, you may need to run git commands with --no-verify.
 *
 * Timing data is streamed through phetTimingLog, please see that file for how to see the results live and/or afterwards.
 *
 * USAGE:
 * cd ${repo}
 * node ../chipper/js/scripts/hook-pre-commit.js
 *
 * OPTIONS:
 * --console: outputs information to the console for debugging
 *
 * See also phet-info/git-template-dir/hooks/pre-commit for how this is used in precommit hooks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const path = require( 'path' );
const execute = require( '../../../perennial-alias/js/common/execute' );
const phetTimingLog = require( '../../../perennial-alias/js/common/phetTimingLog' );

( async () => {

  // Identify the current repo
  const repo = process.cwd().split( path.sep ).pop();

  const precommitSuccess = await phetTimingLog.startAsync( `hook-pre-commit repo="${repo}"`, async () => {

    // Console logging via --console
    const commandLineArguments = process.argv.slice( 2 );
    const outputToConsole = commandLineArguments.includes( '--console' );

    const promises = [ 'lint', 'report-media', 'tsc', 'qunit', 'phet-io-api-compare' ].map( task => {
      return phetTimingLog.startAsync( task, async () => {
        const results = await execute( 'node', [
          '../chipper/js/scripts/hook-pre-commit-task.js',
          `--command=${task}`,
          `--repo=${repo}`,
          outputToConsole ? '--console' : '' ], '../chipper', {
          errors: 'resolve'
        } );
        results.stdout && results.stdout.trim().length > 0 && console.log( results.stdout );
        results.stderr && results.stderr.trim().length > 0 && console.log( results.stderr );

        if ( results.code === 0 ) {
          return 0;
        }
        else {
          let message = 'Task failed: ' + task;
          if ( results.stdout && results.stdout.trim().length > 0 ) {
            message = message + ', ' + results.stdout;
          }
          if ( results.stderr && results.stderr.trim().length > 0 ) {
            message = message + ', ' + results.stderr;
          }
          throw new Error( message );
        }
      }, {
        depth: 1
      } );
    } );

    try {
      await Promise.all( promises );
      console.log( 'All tasks succeeded' );
      return true;
    }
    catch( e ) {

      // Exit as soon as any one promise fails
      // Each task is responsible for outputting its error to the console, so the console should already
      // be showing the error by now
      return false;
    }
  } );

  // generatePhetioMacroAPI is preventing exit for unknown reasons, so manually exit here
  phetTimingLog.close( () => process.exit( precommitSuccess ? 0 : 1 ) );
} )();