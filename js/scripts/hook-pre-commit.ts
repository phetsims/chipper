// Copyright 2022-2024, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.  Avoids the overhead of grunt and Gruntfile.js for speed.
 *
 * Should only be run when developing in main, because when dependency shas are checked out for one sim,
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
 * --force: forces all tasks to run, even if they are disabled in the local preferences
 *
 * See also phet-info/git-template-dir/hooks/pre-commit for how this is used in precommit hooks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import path from 'path';
import buildLocal from '../../../perennial-alias/js/common/buildLocal.js';
import execute from '../../../perennial-alias/js/common/execute.js';
import phetTimingLog from '../../../perennial-alias/js/common/phetTimingLog.js';
import tsxCommand from '../../../perennial-alias/js/common/tsxCommand.js';

// These repos do not require precommit hooks to be run
const optOutRepos = [

  // The files here are predominantly autogenerated and unlikely to be broken. Also, every repo depends on babel
  // so running precommit hooks here takes a significant amount of time
  'babel'
];

// Console logging via --console
const commandLineArguments = process.argv.slice( 2 );
const outputToConsole = commandLineArguments.includes( '--console' );
const force = commandLineArguments.includes( '--force' );

// Force certain tasks to run indepndently of settings in build-local.json.
// Takes precedence if specified, to be used in conjuction with precommit-hook-multi.js
// Example: node chipper/js/scripts/precommit-hook-multi.js --forceTasks=lint,report-media,check,test
const forceTasks = commandLineArguments.find( arg => arg.startsWith( '--forceTasks=' ) );

( async () => {

  // Identify the current repo
  const repo = process.cwd().split( path.sep ).pop()!;

  if ( optOutRepos.includes( repo ) ) {
    console.log( `Skipping precommit hooks for the repo: ${repo}` );
    process.exit( 0 );
  }

  // By default, run all tasks
  let tasksToRun = [ 'lint', 'report-media', 'check', 'test', 'phet-io-api-compare' ];
  const OPT_OUT_ALL = '*'; // Key to opt out of all tasks

  // check local preferences for overrides for which tasks to turn 'off'
  const hookPreCommit = buildLocal.hookPreCommit;
  if ( hookPreCommit && !force ) {
    if ( hookPreCommit[ OPT_OUT_ALL ] === false ) {
      outputToConsole && console.log( 'all tasks opted out' );
      tasksToRun.length = 0;
    }
    else {
      Object.keys( hookPreCommit ).forEach( key => {
        if ( hookPreCommit[ key ] === false && tasksToRun.includes( key ) ) {
          outputToConsole && console.log( 'task opted out:', key );
          tasksToRun.splice( tasksToRun.indexOf( key ), 1 );
        }
      } );
    }
  }

  if ( forceTasks ) {
    tasksToRun = forceTasks.split( '=' )[ 1 ].split( ',' );
  }

  const precommitSuccess = await phetTimingLog.startAsync( `hook-pre-commit repo="${repo}"`, async () => {

    outputToConsole && console.log( 'repo:', repo );

    const taskResults = await Promise.allSettled(
      tasksToRun.map( task => {
        return phetTimingLog.startAsync(
          task,
          async () => {
            const results = await execute(
              tsxCommand,
              [
                '../chipper/js/scripts/hook-pre-commit-task.ts',
                `--command=${task}`,
                `--repo=${repo}`,
                outputToConsole ? '--console' : ''
              ],
              '../chipper',
              {
                errors: 'resolve'
              }
            );
            assert( typeof results !== 'string' );
            results.stdout && results.stdout.trim().length > 0 && console.log( results.stdout );
            results.stderr && results.stderr.trim().length > 0 && console.log( results.stderr );

            if ( results.code === 0 ) {
              return { task: task, success: true };
            }
            else {
              let message = 'Task failed: ' + task;
              if ( results.stdout && results.stdout.trim().length > 0 ) {
                message = message + ': ' + results.stdout;
              }
              if ( results.stderr && results.stderr.trim().length > 0 ) {
                message = message + ': ' + results.stderr;
              }
              return { task: task, success: false, message: message };
            }
          },
          {
            depth: 1
          }
        );
      } )
    );

    taskResults.forEach( result => {
      if ( result.status === 'fulfilled' ) {
        if ( result.value.success ) {
          console.log( `Task ${result.value.task} succeeded` );
        }
        else {
          console.error( result.value.message );
        }
      }
      else {
        console.error( `Task ${result.reason.task} encountered an error: ${result.reason.message}` );
      }
    } );

    return taskResults.every( result => result.status === 'fulfilled' && result.value.success );
  } );

  // generatePhetioMacroAPI is preventing exit for unknown reasons, so manually exit here
  phetTimingLog.close( () => process.exit( precommitSuccess ? 0 : 1 ) );
} )();