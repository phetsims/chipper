// Copyright 2020-2026, University of Colorado Boulder

/**
 * See grunt/tasks/pre-commit.ts. This implements each task for that process so they can run in parallel. This is run
 * as a script, and not as a module.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import fs from 'fs';
import execute from '../../../../perennial-alias/js/common/execute.js';
import getRepoList from '../../../../perennial-alias/js/common/getRepoList.js';
import npmCommand from '../../../../perennial-alias/js/common/npmCommand.js';
import withServer from '../../../../perennial-alias/js/common/withServer.js';
import lint from '../../../../perennial-alias/js/eslint/lint.js';
import typeCheck from '../../../../perennial-alias/js/grunt/typeCheck.js';
import puppeteer from '../../../../perennial-alias/js/npm-dependencies/puppeteer.js';
import puppeteerQUnit from '../../../../perennial-alias/js/test/puppeteerQUnit.js';
import getPhetLibs from '../../grunt/getPhetLibs.js';
import reportMedia from '../../grunt/reportMedia.js';
import generatePhetioMacroAPI from '../../phet-io/generatePhetioMacroAPI.js';
import phetioCompareAPISets from '../../phet-io/phetioCompareAPISets.js';
import transpile from '../transpile.js';


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

    // Run qunit tests if puppeteerQUnit exists in the checked-out SHAs and a test HTML exists.
    const qUnitOKPromise = ( async () => {

      if ( repo !== 'scenery' && repo !== 'phet-io-wrappers' ) { // scenery unit tests take too long, so skip those
        const testFilePath = `${repo}/${repo}-tests.html`;
        const exists = fs.existsSync( `../${testFilePath}` );
        if ( exists ) {

          outputToConsole && console.log( 'unit-test: testing browser QUnit' );
          const browser = await puppeteer.launch( {
            args: [
              '--disable-gpu'
            ]
          } );

          const result = await withServer( async port => {
            return puppeteerQUnit( browser, `http://localhost:${port}/${testFilePath}?ea&brand=phet-io` );
          } ) as { ok: boolean };

          await browser.close();

          outputToConsole && console.log( `unit-test: ${JSON.stringify( result, null, 2 )}` );
          if ( !result.ok ) {
            console.error( `unit tests failed in ${repo}`, result );
            return false;
          }
          else {
            return true;
          }
        }
        else {
          outputToConsole && console.log( 'unit-test: no browser unit tests detected' );
        }

        return true;
      }
      return true;
    } )();

    const npmRunTestOkPromise = ( async () => {

      // Detect the presence of npm run test by looking in package.json's scripts.test
      let hasNpmRunTest = false;
      try {
        const packageString = fs.readFileSync( `../${repo}/package.json`, 'utf8' );
        const packageJSON = JSON.parse( packageString );
        if ( packageJSON.scripts?.hasOwnProperty( 'test' ) ) {
          hasNpmRunTest = true;
        }
      }
      catch( e ) {
        // no package.json or not parseable
      }

      if ( hasNpmRunTest ) {
        outputToConsole && console.log( 'unit-test: testing "npm run test" task' );
        const output = await execute( npmCommand, [ 'run', 'test' ], `../${repo}`, { errors: 'resolve' } );
        const testPassed = output.code === 0;

        ( outputToConsole || !testPassed ) && output.stdout.length > 0 && console.log( output.stdout );
        ( outputToConsole || !testPassed ) && output.stderr.length > 0 && console.log( output.stderr );

        return testPassed;
      }
      else {
        return true;
      }
    } )();

    const results = await Promise.all( [ qUnitOKPromise, npmRunTestOkPromise ] );
    const qUnitOK = results[ 0 ];
    const npmRunTestOk = results[ 1 ];
    outputToConsole && console.log( `unit-test: QUnit browser success: ${qUnitOK}` );
    outputToConsole && console.log( `unit-test: npm run test success: ${npmRunTestOk}` );

    process.exit( ( qUnitOK && npmRunTestOk ) ? 0 : 1 );
  }

  else if ( command === 'phet-io-api' ) {

    ////////////////////////////////////////////////////////////////////////////////
    // Compare PhET-iO APIs for this repo and anything that has it as a dependency
    //
    const phetioAPIOK = await ( async () => {

      // If running git hooks in phet-io-sim-specific, it isn't worth regenerating the API for every single stable sim.
      // Instead, rely on the hooks from the repos where the api changes come from.
      if ( repo === 'phet-io-sim-specific' ) {
        return true;
      }

      // Test this repo and all phet-io sims that have it as a dependency.  For instance, changing sun would test
      // every phet-io stable sim.
      const phetioAPIStable = getRepoList( 'phet-io-api-stable' );
      const reposToTest = phetioAPIStable.filter( phetioSimRepo => getPhetLibs( phetioSimRepo ).includes( repo ) );

      if ( reposToTest.length > 0 ) {
        const repos = new Set<string>();
        reposToTest.forEach( sim => getPhetLibs( sim ).forEach( lib => repos.add( lib ) ) );
        await transpile( {
          repos: Array.from( repos ),
          silent: true
        } );

        const proposedAPIs = await generatePhetioMacroAPI( reposToTest, {
          showProgressBar: reposToTest.length > 1,
          showMessagesFromSim: false
        } );

        return phetioCompareAPISets( reposToTest, proposedAPIs );
      }
      else {
        return true;
      }
    } )();

    process.exit( phetioAPIOK ? 0 : 1 );
  }
} )();