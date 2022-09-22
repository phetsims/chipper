// Copyright 2020-2022, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.  Avoids the overhead of grunt and Gruntfile.js for speed
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

// Require statements which should be generally available via node or perennial
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

( async () => {

// Identify the current repo
  const repo = process.cwd().split( path.sep ).pop();

// Console logging via --console
  const commandLineArguments = process.argv.slice( 2 );
  const outputToConsole = commandLineArguments.includes( '--console' );

// Run lint tests if they exist in the checked-out SHAs.
  try {
    const lint = require( '../../../chipper/js/grunt/lint' );
    if ( lint.chipperAPIVersion === 'promisesPerRepo1' ) {

      // lint() automatically filters out non-lintable repos
      const lintReturnValue = await lint( [ repo ] );

      if ( !lintReturnValue.ok ) {
        process.exit( 1 );
      }

      outputToConsole && console.log( `Linting passed with results.length: ${lintReturnValue.results.length}` );
    }
    else {
      console.log( 'chipper/js/grunt/lint not compatible' );
    }
  }
  catch( e ) {
    console.log( 'chipper/js/grunt/lint not found' );
  }

// These sims don't have package.json or media that requires checking.
  const optOutOfReportMedia = [
    'decaf',
    'phet-android-app',
    'babel',
    'phet-info',
    'phet-ios-app',
    'sherpa',
    'smithers',
    'tasks',
    'weddell'
  ];

// Make sure license.json for images/audio is up-to-date
  if ( !optOutOfReportMedia.includes( repo ) ) {
    try {
      const reportMedia = require( '../../../chipper/js/grunt/reportMedia' );

      const success = await reportMedia( repo );

      // At the moment reportMedia uses grunt.fail, but we defensively use the return value here in case that changes.
      if ( !success ) {
        process.exit( 1 );
      }
    }
    catch( e ) {
      console.log( 'chipper/js/grunt/reportMedia not found' );
    }
  }

  // Run typescript type checker if it exists in the checked-out shas
  const results = await execute( 'node', [ '../chipper/js/scripts/absolute-tsc.js', '../chipper/tsconfig/all' ], '../chipper', {
    errors: 'resolve'
  } );

  results.stderr.trim().length > 0 && console.log( results.stderr );
  results.stdout.trim().length > 0 && console.log( results.stdout );

  if ( results.code === 0 ) {
    outputToConsole && console.log( 'tsc passed' );
  }
  else {
    console.log( results );
    process.exit( results.code );
  }

// Run qunit tests if puppeteerQUnit exists in the checked-out SHAs and a test HTML exists.
  try {
    const puppeteerQUnit = require( '../../../aqua/js/local/puppeteerQUnit' );
    const cacheKey = `puppeteerQUnit#${repo}`;

    if ( repo !== 'scenery' && repo !== 'phet-io-wrappers' ) { // scenery unit tests take too long, so skip those
      const testFilePath = `${repo}/${repo}-tests.html`;
      const exists = fs.existsSync( `../${testFilePath}` );
      if ( exists ) {

        if ( CacheLayer.isCacheSafe( cacheKey ) ) {
          console.log( 'unit tests success cached' );
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
            process.exit( 1 ); // fail as soon as there is one problem
          }
          else {
            CacheLayer.onSuccess( cacheKey );
          }
        }
      }

      outputToConsole && console.log( 'QUnit: no problems detected' );
    }
  }
  catch( e ) {
    console.log( e );
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Compare PhET-iO APIs for this repo and anything that has it as a dependency
  //
  ( async () => {

    // Test this repo and all phet-io sims that have it as a dependency.  For instance, changing sun would test
    // every phet-io stable sim.
    const phetioAPIStable = getRepoList( 'phet-io-api-stable' );

    const reposToTest = phetioAPIStable.filter( phetioSimRepo => getPhetLibs( phetioSimRepo ).includes( repo ) );

    if ( reposToTest.length > 0 ) {
      console.log( 'PhET-iO API testing: ' + reposToTest );

      const cacheKey = 'phet-io-api-testing_' + reposToTest.join( '_' );

      if ( !CacheLayer.isCacheSafe( cacheKey ) ) {

        const proposedAPIs = await generatePhetioMacroAPI( reposToTest, {
          showProgressBar: reposToTest.length > 1,
          showMessagesFromSim: false
        } );

        const compareSuccess = await phetioCompareAPISets( reposToTest, proposedAPIs, {} );

        if ( compareSuccess ) {

          CacheLayer.onSuccess( cacheKey );

          // generatePhetioMacroAPI is preventing exit for unknown reasons, so manually exit here
          process.exit( 0 );
        }
        else {
          process.exit( 1 );
        }
      }
    }
    else {
      console.log( 'PhET-iO API testing: no repos detected' );
    }

  } )();

  // NOTE: if adding or rearranging rules, be careful about the early exit above

} )();