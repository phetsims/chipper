// Copyright 2020-2024, University of Colorado Boulder

/**
 * See grunt/tasks/pre-commit.ts. This implements each task for that process so they can run in parallel.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import fs from 'fs';
import CacheLayer from '../../../chipper/js/common/CacheLayer.js';
import reportMedia from '../../../chipper/js/grunt/reportMedia.js';
import getRepoList from '../../../perennial-alias/js/common/getRepoList.js';
import withServer from '../../../perennial-alias/js/common/withServer.js';
import lint from '../../../perennial-alias/js/eslint/lint.js';
import typeCheck from '../../../perennial-alias/js/grunt/typeCheck.js';
import puppeteer from '../../../perennial-alias/js/npm-dependencies/puppeteer.js';
import puppeteerQUnit from '../../../perennial-alias/js/test/puppeteerQUnit.js';
import transpile from '../common/transpile.js';
import getPhetLibs from '../grunt/getPhetLibs.js';
import generatePhetioMacroAPI from '../phet-io/generatePhetioMacroAPI.js';
import phetioCompareAPISets from '../phet-io/phetioCompareAPISets.js';

type Repo = string;

const commandLineArguments = process.argv.slice( 2 );
const outputToConsole = commandLineArguments.includes( '--console' );
const absolute = commandLineArguments.includes( '--absolute' );

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
    const lintSuccess = await lint( [ repo ] );
    outputToConsole && console.log( `Linting had ${lintSuccess ? 'no ' : ''}errors.` );
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
    const qUnitOK = await ( async () => {

      const cacheKey = `puppeteerQUnit#${repo}`;

      if ( repo !== 'scenery' && repo !== 'phet-io-wrappers' ) { // scenery unit tests take too long, so skip those
        const testFilePath = `${repo}/${repo}-tests.html`;
        const exists = fs.existsSync( `../${testFilePath}` );
        if ( exists ) {

          if ( CacheLayer.isCacheSafe( cacheKey ) ) {
            return true;
          }
          else {
            const browser = await puppeteer.launch( {
              args: [
                '--disable-gpu'
              ]
            } );

            const result = await withServer( async port => {
              return puppeteerQUnit( browser, `http://localhost:${port}/${testFilePath}?ea&brand=phet-io` );
            } );

            await browser.close();

            outputToConsole && console.log( `${repo}: ${JSON.stringify( result, null, 2 )}` );
            if ( !result.ok ) {
              console.error( `unit tests failed in ${repo}`, result );
              return false;
            }
            else {
              CacheLayer.onSuccess( cacheKey );
              return true;
            }
          }
        }

        outputToConsole && console.log( 'QUnit: no problems detected' );
        return true;
      }
      return true;
    } )();

    process.exit( qUnitOK ? 0 : 1 );
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

      const getCacheKey = ( repo: Repo ) => `phet-io-api#${repo}`;

      // Test this repo and all phet-io sims that have it as a dependency.  For instance, changing sun would test
      // every phet-io stable sim.
      const phetioAPIStable = getRepoList( 'phet-io-api-stable' );
      const reposToTest = phetioAPIStable
        .filter( phetioSimRepo => getPhetLibs( phetioSimRepo ).includes( repo ) )

        // Only worry about the ones that are not cached
        .filter( repo => !CacheLayer.isCacheSafe( getCacheKey( repo ) ) );

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

        const phetioAPIComparisonSuccessful = await phetioCompareAPISets( reposToTest, proposedAPIs );

        if ( phetioAPIComparisonSuccessful ) {
          reposToTest.forEach( repo => CacheLayer.onSuccess( getCacheKey( repo ) ) );
        }

        return phetioAPIComparisonSuccessful;
      }
      else {
        return true;
      }
    } )();

    process.exit( phetioAPIOK ? 0 : 1 );
  }
} )();