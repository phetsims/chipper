// Copyright 2020, University of Colorado Boulder

/**
 * Runs tasks for pre-commit, including lint and qunit testing.  Avoids the overhead of grunt and Gruntfile.js for speed
 *
 * USAGE:
 * cd ${repo}
 * node ../perennial/js/scripts/hook-pre-commit.js
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
const _ = require( 'lodash' ); // eslint-disable-line
const puppeteer = require( 'puppeteer' );
const buildLocal = require( '../common/buildLocal' );

// Identify the current repo
const repo = process.cwd().split( path.sep ).pop();

// Console logging via --console
const commandLineArguments = process.argv.slice( 2 );
const outputToConsole = commandLineArguments.indexOf( '--console' ) >= 0;

// Run lint tests if they exist in the checked-out SHAs.
try {
  const lint = require( '../../../chipper/js/grunt/lint' );
  if ( lint.chipperAPIVersion === 'promises1' ) {

    ( async () => {

      // lint() automatically filters out non-lintable repos
      // TODO: https://github.com/phetsims/phet-info/issues/150 we may want to autofix
      const results = await lint( [ `../${repo}` ], {
        cache: true,
        fix: false,
        warn: false
      } );

      const problems = results.filter( result => result.errorCount > 0 || result.warningCount > 0 );
      problems.forEach( result => console.error( `lint failed in ${repo}`, result.filePath, result.messages.map( m => JSON.stringify( m, null, 2 ) ).join( '\n' ) ) );
      if ( problems.length > 0 ) {
        process.exit( 1 );
      }

      outputToConsole && console.log( 'Linting passed with results.length: ' + results.length );
    } )();
  }
  else {
    console.log( 'chipper/js/grunt/lint not compatible' );
  }
}
catch( e ) {
  console.log( 'chipper/js/grunt/lint not found' );
}

const optOutOfReportMedia = [ 'decaf', 'phet-android-app' ];

// Make sure license.json for images/audio is up-to-date
if ( !optOutOfReportMedia.includes( repo ) ) {
  try {
    const reportMedia = require( '../../../chipper/js/grunt/reportMedia' );

    ( async () => {
      const success = await reportMedia( repo );

      // At the moment reportMedia uses grunt.fail, but we defensively use the return value here in case that changes.
      if ( !success ) {
        process.exit( 1 );
      }
    } )();
  }
  catch( e ) {
    console.log( 'chipper/js/grunt/reportMedia not found' );
  }
}

// Run qunit tests if puppeteerQUnit exists in the checked-out SHAs and a test HTML exists.
try {
  const puppeteerQUnit = require( '../../../aqua/js/local/puppeteerQUnit' );
  if ( repo !== 'scenery' && repo !== 'phet-io-wrappers' ) { // scenery unit tests take too long, so skip those
    ( async () => {
      const testFilePath = `${repo}/${repo}-tests.html`;
      const exists = fs.existsSync( `../${testFilePath}` );
      if ( exists ) {
        const browser = await puppeteer.launch();

        const localTestingURL = buildLocal.localTestingURL.endsWith( '/' ) ? buildLocal.localTestingURL : `${buildLocal.localTestingURL}/`;
        const result = await puppeteerQUnit( browser, `${localTestingURL}${testFilePath}?ea&brand=phet-io` );
        await browser.close();
        outputToConsole && console.log( `${repo}: ${JSON.stringify( result, null, 2 )}` );
        if ( !result.ok ) {
          console.error( `unit tests failed in ${repo}`, result );
          process.exit( 1 ); // fail as soon as there is one problem
        }
      }

      outputToConsole && console.log( 'no problems detected' );
    } )();
  }
}
catch( e ) {
  console.log( e );
}

// If there is a PhET-iO API Safety Net, compare to it
try {

  const generateMacroAPI = require( '../../../chipper/js/phet-io/generateMacroAPI' );
  const compareMacroAPIs = require( '../../../chipper/js/phet-io/compareMacroAPIs' );
  const REFERENCE_MACRO_API_PATH = '../perennial/build-phet-io/reference-macro-api.json';
  const exists = fs.existsSync( REFERENCE_MACRO_API_PATH );

  if ( exists ) {

    // load the safety net
    const safetyNetText = fs.readFileSync( REFERENCE_MACRO_API_PATH, 'utf8' );
    const safetyNetJSON = JSON.parse( safetyNetText );

    const repos = Object.keys( safetyNetJSON );
    console.log( 'Checking PhET-iO API compatibility for ' + repos.join( ', ' ) );

    const chunkSize = 4;
    ( async () => {
      const results = await generateMacroAPI( repos, {
        chunkSize: chunkSize,
        showMessagesFromSim: false // must be pure JSON
      } );
      const comparisonResults = compareMacroAPIs( safetyNetJSON, results );
      if ( comparisonResults.problems.length > 0 ) {
        console.log( comparisonResults.formatted );
        process.exit( 1 );
      }
      else {
        process.exit( 0 );
      }
    } )();
  }
}
catch( e ) {
  console.log( e );
}