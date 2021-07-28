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
const withServer = require( '../common/withServer' );

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

      outputToConsole && console.log( `Linting passed with results.length: ${results.length}` );
    } )();
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
  'phet-io-client-guides',
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

        const result = await withServer( async port => {
          return puppeteerQUnit( browser, `http://localhost:${port}/${testFilePath}?ea&brand=phet-io` );
        } );

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

// Run typescript type checker if it exists in the checked-out shas
try {
  const tsc = require( '../../../chipper/js/grunt/tsc' );
  if ( tsc.apiVersion === '1.0' ) {

    ( async () => {

      // lint() automatically filters out non-lintable repos
      const results = await tsc( `../${repo}`, [] );
      if ( results.stderr.length > 0 ) {
        console.log( results.stderr );
        process.exit( 1 );
      }

      outputToConsole && console.log( 'tsc passed' );
    } )();
  }
  else {
    console.log( 'chipper/js/grunt/tsc not compatible' );
  }
}
catch( e ) {
  console.log( 'chipper/js/grunt/tsc not found' );
}