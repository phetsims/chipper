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

  // lint() automatically filters out non-lintable repos
  const report = lint( [ repo ], true, false, true );

  if ( report.errorCount > 0 || report.warningCount > 0 ) {
    console.error( `lint failed in ${repo}`, report.results );
    process.exit( 1 );
  }

  outputToConsole && console.log( 'Linting passed with results.length: ' + report.results.length );
}
catch( e ) {
  console.log( 'chipper/js/grunt/lint not found' );
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

        // phet-io repo unit tests must be run with brand=phet-io
        const queryString = repo === 'phet-io' ? '&brand=phet-io' : '';

        const localTestingURL = buildLocal.localTestingURL.endsWith( '/' ) ? buildLocal.localTestingURL : `${buildLocal.localTestingURL}/`;
        const result = await puppeteerQUnit( browser, `${localTestingURL}${testFilePath}?ea${queryString}` );
        await browser.close();
        outputToConsole && console.log( `${repo}: ${JSON.stringify( result, null, 2 )}` );
        if ( !result.ok ) {
          console.error( `unit tests failed in ${repo}`, result );
          process.exit( 1 ); // fail as soon as there is one problem
        }
      }

      outputToConsole && console.log( 'no problems detected' );
      process.exit( 0 );
    } )();
  }
}
catch( e ) {
  console.log( 'puppeteerQUnit not found.' );
}