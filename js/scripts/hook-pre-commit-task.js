// Copyright 2020-2023, University of Colorado Boulder

/**
 * See hook-pre-commit. This implements each task for that process so they can run in parallel.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );
const withServer = require( '../../../perennial-alias/js/common/withServer' );
const execute = require( '../../../perennial-alias/js/common/execute' );
const getPhetLibs = require( '../grunt/getPhetLibs' );
const getRepoList = require( '../../../perennial-alias/js/common/getRepoList' );
const generatePhetioMacroAPI = require( '../phet-io/generatePhetioMacroAPI' );
const CacheLayer = require( '../../../chipper/js/common/CacheLayer' );
const phetioCompareAPISets = require( '../phet-io/phetioCompareAPISets' );
const lint = require( '../../../chipper/js/grunt/lint' );
const reportMedia = require( '../../../chipper/js/grunt/reportMedia' );
const puppeteerQUnit = require( '../../../aqua/js/local/puppeteerQUnit' );

const commandLineArguments = process.argv.slice( 2 );
const outputToConsole = commandLineArguments.includes( '--console' );

const getArg = arg => {
  const args = commandLineArguments.filter( commandLineArg => commandLineArg.startsWith( `--${arg}=` ) );
  if ( args.length !== 1 ) {
    throw new Error( `expected only one arg: ${args}` );
  }
  return args[ 0 ].split( '=' )[ 1 ];
};

const command = getArg( 'command' );
const repo = getArg( 'repo' );

( async () => {

  if ( command === 'lint' ) {

    // Run lint tests if they exist in the checked-out SHAs.
    // lint() automatically filters out non-lintable repos
    const lintReturnValue = await lint( [ repo ] );
    outputToConsole && console.log( `Linting passed with results.length: ${lintReturnValue.results.length}` );
    process.exit( lintReturnValue.ok ? 0 : 1 );
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

  else if ( command === 'tsc' ) {


    // Run typescript type checker if it exists in the checked-out shas
    const results = await execute( 'node', [ '../chipper/js/scripts/absolute-tsc.js', '../chipper/tsconfig/all' ], '../chipper', {
      errors: 'resolve'
    } );

    results.stderr.trim().length > 0 && console.log( results.stderr );
    results.stdout.trim().length > 0 && console.log( results.stdout );

    if ( results.code === 0 ) {
      outputToConsole && console.log( 'tsc passed' );
      process.exit( 0 );
    }
    else {
      outputToConsole && console.log( 'tsc failed' );
      process.exit( 1 );
    }
  }

  else if ( command === 'qunit' ) {

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

  else if ( command === 'phet-io-api-compare' ) {

    ////////////////////////////////////////////////////////////////////////////////
    // Compare PhET-iO APIs for this repo and anything that has it as a dependency
    //
    const phetioAPIOK = await ( async () => {

      const getCacheKey = repo => `phet-io-api-compare#${repo}`;

      // Test this repo and all phet-io sims that have it as a dependency.  For instance, changing sun would test
      // every phet-io stable sim.
      const phetioAPIStable = getRepoList( 'phet-io-api-stable' );
      const reposToTest = phetioAPIStable
        .filter( phetioSimRepo => getPhetLibs( phetioSimRepo ).includes( repo ) )

        // Only worry about the ones that are not cached
        .filter( repo => !CacheLayer.isCacheSafe( getCacheKey( repo ) ) );

      if ( reposToTest.length > 0 ) {

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