// Copyright 2020-2022, University of Colorado Boulder

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

const fs = require( 'fs' );
const path = require( 'path' );
const puppeteer = require( 'puppeteer' );
const withServer = require( '../../../perennial-alias/js/common/withServer' );
const execute = require( '../../../perennial-alias/js/common/execute' );
const getPhetLibs = require( '../grunt/getPhetLibs' );
const getRepoList = require( '../../../perennial-alias/js/common/getRepoList' );
const generatePhetioMacroAPI = require( '../phet-io/generatePhetioMacroAPI' );
const CacheLayer = require( '../../../chipper/js/common/CacheLayer' );
const phetioCompareAPISets = require( '../phet-io/phetioCompareAPISets' );
const phetTimingLog = require( '../../../perennial-alias/js/common/phetTimingLog' );
const lint = require( '../../../chipper/js/grunt/lint' );
const reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
const puppeteerQUnit = require( '../../../aqua/js/local/puppeteerQUnit' );

( async () => {

  // Identify the current repo
  const repo = process.cwd().split( path.sep ).pop();

  const precommitSuccess = await phetTimingLog.startAsync( `hook-pre-commit repo="${repo}"`, async () => {

    // Console logging via --console
    const commandLineArguments = process.argv.slice( 2 );
    const outputToConsole = commandLineArguments.includes( '--console' );

    // Run lint tests if they exist in the checked-out SHAs.
    const lintOK = await phetTimingLog.startAsync( 'lint', async () => {

      // lint() automatically filters out non-lintable repos
      const lintReturnValue = await lint( [ repo ] );
      outputToConsole && console.log( `Linting passed with results.length: ${lintReturnValue.results.length}` );
      return lintReturnValue.ok;
    } );

    if ( !lintOK ) {
      return false;
    }

    const reportMediaOK = await phetTimingLog.startAsync( 'report-media', async () => {

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
        return success;
      }
      else {

        // no need to check
        return true;
      }
    } );

    if ( !reportMediaOK ) {
      return false;
    }

    const tscOK = await phetTimingLog.startAsync( 'tsc', async () => {

      // Run typescript type checker if it exists in the checked-out shas
      const results = await execute( 'node', [ '../chipper/js/scripts/absolute-tsc.js', '../chipper/tsconfig/all' ], '../chipper', {
        errors: 'resolve'
      } );

      results.stderr.trim().length > 0 && console.log( results.stderr );
      results.stdout.trim().length > 0 && console.log( results.stdout );

      if ( results.code === 0 ) {
        outputToConsole && console.log( 'tsc passed' );
        return true;
      }
      else {
        console.log( results );
        return false;
      }
    } );

    if ( !tscOK ) {
      return false;
    }

    const qunitOK = await phetTimingLog.startAsync( 'qunit', async () => {
// Run qunit tests if puppeteerQUnit exists in the checked-out SHAs and a test HTML exists.

      const cacheKey = `puppeteerQUnit#${repo}`;

      if ( repo !== 'scenery' && repo !== 'phet-io-wrappers' ) { // scenery unit tests take too long, so skip those
        const testFilePath = `${repo}/${repo}-tests.html`;
        const exists = fs.existsSync( `../${testFilePath}` );
        if ( exists ) {

          if ( CacheLayer.isCacheSafe( cacheKey ) ) {
            console.log( 'unit tests success cached' );
            return true;
          }
          else {
            const browser = await puppeteer.launch();

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
    } );

    if ( !qunitOK ) {
      return false;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Compare PhET-iO APIs for this repo and anything that has it as a dependency
    //
    const phetioAPIOK = await phetTimingLog.startAsync( 'phet-io-api-compare', async () => {

      const getCacheKey = repo => `phet-io-api-compare#${repo}`;

      // Test this repo and all phet-io sims that have it as a dependency.  For instance, changing sun would test
      // every phet-io stable sim.
      const phetioAPIStable = getRepoList( 'phet-io-api-stable' );
      const reposToTest = phetioAPIStable
        .filter( phetioSimRepo => getPhetLibs( phetioSimRepo ).includes( repo ) )

        // Only worry about the ones that are not cached
        .filter( repo => !CacheLayer.isCacheSafe( getCacheKey( repo ) ) );

      if ( reposToTest.length > 0 ) {
        console.log( 'PhET-iO API testing: ' + reposToTest );

        const proposedAPIs = await generatePhetioMacroAPI( reposToTest, {
          showProgressBar: reposToTest.length > 1,
          showMessagesFromSim: false
        } );

        const phetioAPIComparisonSuccessful = await phetioCompareAPISets( reposToTest, proposedAPIs, {} );

        if ( phetioAPIComparisonSuccessful ) {
          reposToTest.forEach( repo => CacheLayer.onSuccess( getCacheKey( repo ) ) );
        }

        return phetioAPIComparisonSuccessful;
      }
      else {
        console.log( 'PhET-iO API testing: no repos to test' );
        return true;
      }
    } );

    if ( !phetioAPIOK ) {
      return false;
    }

    // OTHER TESTS GO HERE

    // NOTE: if adding or rearranging rules, be careful about the early exit above
    // If everything passed, return true for success
    return true;
  } );

  // generatePhetioMacroAPI is preventing exit for unknown reasons, so manually exit here
  phetTimingLog.close( () => process.exit( precommitSuccess ? 0 : 1 ) );
} )();