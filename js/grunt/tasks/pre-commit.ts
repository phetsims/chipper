// Copyright 2022-2024, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.
 *
 * Should only be run when developing in main, because when dependency shas are checked out for one sim,
 * they will likely be inconsistent for other repos which would cause failures for cross-repo processes like type checking.
 * This means when running maintenance release steps, you may need to run git commands with --no-verify.
 *
 * Timing data is streamed through phetTimingLog, please see that file for how to see the results live and/or afterwards.
 *
 * USAGE:
 * cd ${repo}
 * sage run ../chipper/js/scripts/pre-commit.js
 *
 * OPTIONS:
 * --console: outputs information to the console for debugging
 * --allTasks: forces all tasks to run, even if they are disabled in the local preferences
 * --changed: run on all repos with working copy changes
 * --all: run on all repos
 * --absolute: output paths that WebStorm External Tools can parse and hyperlink
 *
 * TASKS:
 * --lint: runs eslint on the repo
 * --report-media: checks for missing or unused media files
 * --check: runs check.js
 * --unit-test: runs qunit tests
 * --phet-io-api: compares the PhET-iO API with the previous version
 *
 * See also phet-info/git-template-dir/hooks/pre-commit for how this is used in precommit hooks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import path from 'path';
import buildLocal from '../../../../perennial-alias/js/common/buildLocal.js';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import execute from '../../../../perennial-alias/js/common/execute.js';
import getActiveRepos from '../../../../perennial-alias/js/common/getActiveRepos.js';
import { Repo } from '../../../../perennial-alias/js/common/PerennialTypes.js';
import phetTimingLog from '../../../../perennial-alias/js/common/phetTimingLog.js';
import tsxCommand from '../../../../perennial-alias/js/common/tsxCommand.js';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getReposWithWorkingCopyChanges from '../../common/getReposWithWorkingCopyChanges.js';

// These repos do not require precommit hooks to be run
const optOutRepos = [

  // The files here are predominantly autogenerated and unlikely to be broken. Also, every repo depends on babel
  // so running precommit hooks here takes a significant amount of time
  'babel'
];

const repo = getRepo();

const outputToConsole = getOption( 'console' ); // Console logging via --console
const absolute = getOption( 'absolute' ); // Output paths that WebStorm External Tools can parse and hyperlink

( async () => {

  // Re-spawn the same process on repos with working copy changes
  if ( getOption( 'changed' ) ) {
    const changedRepos = await getReposWithWorkingCopyChanges();
    const success = await spawnOnRepos( changedRepos, outputToConsole );
    process.exit( success ? 0 : 1 );
    return;
  }

  // Re-spawn the same process on all repos
  if ( getOption( 'all' ) ) {
    const success = await spawnOnRepos( getActiveRepos(), outputToConsole );
    process.exit( success ? 0 : 1 );
    return;
  }

  if ( optOutRepos.includes( repo ) ) {
    console.log( `Skipping precommit hooks for the repo: ${repo}` );
    process.exit( 0 );
  }

  const possibleTasks = [ 'lint', 'report-media', 'check', 'unit-test', 'phet-io-api' ];

  // By default, run all tasks
  let tasksToRun = [ ...possibleTasks ];
  const OPT_OUT_ALL = '*'; // Key to opt out of all tasks

  // check local preferences for overrides for which tasks to turn 'off'
  const hookPreCommit = buildLocal.hookPreCommit;
  if ( hookPreCommit && hookPreCommit[ OPT_OUT_ALL ] === false ) {
    outputToConsole && console.log( 'all tasks opted out from build-local.json' );
    tasksToRun.length = 0;
  }

  possibleTasks.forEach( ( task: string ) => {

    // process the buildLocal preferences first
    if ( hookPreCommit && hookPreCommit[ task ] === false ) {
      outputToConsole && console.log( 'task opted out from build-local.json:', task );
      tasksToRun = tasksToRun.filter( t => t !== task );
    }

    // process the CLI overrides
    if ( isOptionKeyProvided( task ) ) {
      if ( getOption( task ) ) {
        if ( !tasksToRun.includes( task ) ) {
          outputToConsole && console.log( 'task added from CLI:', task );
          tasksToRun.push( task );
        }
      }
      else {
        outputToConsole && console.log( 'task removed from CLI:', task );
        tasksToRun = tasksToRun.filter( t => t !== task );
      }
    }
  } );

  if ( getOption( 'allTasks' ) ) {
    outputToConsole && console.log( 'forcing all tasks to run' );
    tasksToRun = [ ...possibleTasks ];
  }

  outputToConsole && console.log( 'tasks to run:', tasksToRun );

  const precommitSuccess = await phetTimingLog.startAsync( `pre-commit repo="${repo}"`, async () => {

    outputToConsole && console.log( 'repo:', repo );

    const taskResults = await Promise.allSettled(
      tasksToRun.map( task => {
        return phetTimingLog.startAsync(
          task,
          async () => {
            const results = await execute(
              tsxCommand,
              [
                '../chipper/js/common/pre-commit-main.ts',
                `--command=${task}`,
                `--repo=${repo}`,
                outputToConsole ? '--console' : '',
                absolute ? '--absolute' : ''
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

/**
 * Spawns the same process on each repo in the list
 */
async function spawnOnRepos( repos: Repo[], outputToConsole: boolean ): Promise<boolean> {
  const startTime = Date.now();

  let success = true;

  // This is done sequentially so we don't spawn a bunch of uncached tsc at once, but in the future we may want to optimize
  // to run one sequentially then the rest in parallel
  for ( let i = 0; i < repos.length; i++ ) {

    process.stdout.write( repos[ i ] + ': ' );

    // get all argv, but drop out --all and --changed
    const args = process.argv.slice( 2 ).filter( arg => ![ '--all', '--changed' ].includes( arg ) );
    outputToConsole && console.log( 'spawning pre-commit.ts with args:', args );

    // @ts-expect-error
    const __dirname = dirname( import.meta.url );

    // get the cwd to the repo, ../../../../repo
    const cwd = path.resolve( __dirname, '../../../../', repos[ i ] );

    const result = await execute( tsxCommand, [ '../chipper/js/grunt/tasks/pre-commit.ts', ...args ], cwd, {

      // resolve errors so Promise.all doesn't fail on first repo that cannot pull/rebase
      errors: 'resolve'
    } );
    outputToConsole && console.log( 'result:', result );
    if ( result.code === 0 ) {
      console.log( 'Success' );
    }
    else {
      console.log();
      result.stdout.trim().length > 0 && console.log( result.stdout.trim() );
      result.stderr.trim().length > 0 && console.log( result.stderr.trim() );
      success = false;
    }
  }

  console.log( 'Done in ' + ( Date.now() - startTime ) + 'ms' );
  return success;
}