// Copyright 2024-2025, University of Colorado Boulder

/**
 * Main logic of pre-commit responsible for launching pre-commit tasks in parallel for a given repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import assert from 'assert';
import execute from '../../../../perennial-alias/js/common/execute.js';
import phetTimingLog from '../../../../perennial-alias/js/common/phetTimingLog.js';
import tsxCommand from '../../../../perennial-alias/js/common/tsxCommand.js';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getPreCommitTasks from './getPreCommitTasks.js';

export async function preCommitMain( repo: string, outputToConsole: boolean ): Promise<void> {
  const absolute = getOption( 'absolute' ); // Output paths that WebStorm External Tools can parse and hyperlink
  const fix = getOption( 'fix' ); // Fix issues that can be automatically fixed

  const tasksToRun = getPreCommitTasks( outputToConsole );

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
                '../chipper/js/common/pre-commit/pre-commit-task.ts',
                `--command=${task}`,
                `--repo=${repo}`,
                outputToConsole ? '--console' : '',
                absolute ? '--absolute' : '',
                fix ? '--fix' : ''
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
}