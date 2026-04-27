// Copyright 2020-2026, University of Colorado Boulder

/**
 * See grunt/tasks/pre-commit.ts. This implements each task for that process so they can run in parallel. This is run
 * as a script, and not as a module.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import path from 'path';
import lint from '../../../../perennial-alias/js/eslint/lint.js';
import typeCheck from '../../../../perennial-alias/js/grunt/typeCheck.js';
import reportMedia from '../../grunt/reportMedia.js';
import runPhetioApiCompare from './runPhetioApiCompare.js';
import runUnitTests from './runUnitTests.js';


const commandLineArguments = process.argv.slice( 2 );
const outputToConsole = commandLineArguments.includes( '--console' );
const absolute = commandLineArguments.includes( '--absolute' );
const fix = commandLineArguments.includes( '--fix' );

const getArg = ( arg: string ) => {
  const args = commandLineArguments.filter( commandLineArg => commandLineArg.startsWith( `--${arg}=` ) );
  if ( args.length !== 1 ) {
    throw new Error( `expected only one arg: ${args}` );
  }
  return args[ 0 ].split( '=' )[ 1 ];
};

const command = getArg( 'command' );
const repo = getArg( 'repo' );

// eslint-disable-next-line @typescript-eslint/no-floating-promises
( async () => {

  if ( command === 'lint' ) {

    // Run lint tests if they exist in the checked-out SHAs.
    // lint() automatically filters out non-lintable repos
    const lintSuccess = await lint( [ repo ], {
      fix: fix
    } );
    outputToConsole && console.log( `lint: ${lintSuccess ? 'no ' : ''}errors.` );
    process.exit( lintSuccess ? 0 : 1 );
  }

  else if ( command === 'report-media' ) {

    // These sims don't have package.json or media that requires checking.
    const optOutOfReportMedia = [
      'decaf',
      'phet-android-app',
      'babel',
      'phet-info',
      'phet-ios-app',
      'qa',
      'sherpa',
      'smithers',
      'tasks',
      'weddell'
    ];

    // Make sure license.json for images/audio is up-to-date
    if ( !optOutOfReportMedia.includes( repo ) ) {

      const success = await reportMedia( repo );
      process.exit( success ? 0 : 1 );
    }
    else {

      // no need to check
      process.exit( 0 );
    }
  }

  else if ( command === 'type-check' ) {
    const success = await typeCheck( {
      all: true,
      silent: !outputToConsole && !absolute, // Don't be silent if absolute output is requested
      absolute: absolute
    } );
    process.exit( success ? 0 : 1 );
  }

  else if ( command === 'unit-test' ) {

    // Legacy pre-commit invokes this task from inside a sim directory, so process.cwd()/.. is
    // the monorepo root.
    const monorepoRoot = path.resolve( '..' );
    const ok = await runUnitTests( repo, monorepoRoot, { outputToConsole: outputToConsole } );
    process.exit( ok ? 0 : 1 );
  }

  else if ( command === 'phet-io-api' ) {

    const monorepoRoot = path.resolve( '..' );
    const ok = await runPhetioApiCompare( repo, monorepoRoot );
    process.exit( ok ? 0 : 1 );
  }
} )();