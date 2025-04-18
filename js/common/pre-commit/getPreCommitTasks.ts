// Copyright 2024-2025, University of Colorado Boulder

/**
 * Parse options and build-local defaults to get the list of tasks to be run for pre-commit hooks.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 *
 */

import buildLocal from '../../../../perennial-alias/js/common/buildLocal.js';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';

const SUPPORTED_TASKS = [ 'lint', 'report-media', 'type-check', 'unit-test', 'phet-io-api' ];

const getPreCommitTasks = ( outputToConsole: boolean ): string[] => {


  // By default, run all tasks
  const OPT_OUT_ALL = '*'; // Key to opt out of all tasks
  let tasksToRun = isOptionKeyProvided( OPT_OUT_ALL ) && !getOption( OPT_OUT_ALL ) ? [] : [ ...SUPPORTED_TASKS ];

  // check local preferences for overrides for which tasks to turn 'off'
  const hookPreCommit = buildLocal.hookPreCommit;
  if ( hookPreCommit && hookPreCommit[ OPT_OUT_ALL ] === false ) {
    outputToConsole && console.log( 'all tasks opted out from build-local.json' );
    tasksToRun.length = 0;
  }

  SUPPORTED_TASKS.forEach( ( task: string ) => {

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
    tasksToRun = [ ...SUPPORTED_TASKS ];
  }
  return tasksToRun;
};

export default getPreCommitTasks;