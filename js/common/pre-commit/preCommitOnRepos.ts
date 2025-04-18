// Copyright 2024-2025, University of Colorado Boulder

/**
 * Spawns the same pre-commit process on each repo in the list
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import path from 'path';
import { Repo } from '../../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import execute from '../../../../perennial-alias/js/common/execute.js';
import tsxCommand from '../../../../perennial-alias/js/common/tsxCommand.js';

export default async function preCommitOnRepos( repos: Repo[], outputToConsole: boolean ): Promise<boolean> {
  const startTime = Date.now();

  let success = true;

  // This is done sequentially so we don't spawn a bunch of uncached type-check at once, but in the future we may want to optimize
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