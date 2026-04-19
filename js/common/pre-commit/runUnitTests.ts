// Copyright 2026, University of Colorado Boulder

/**
 * Run browser QUnit tests (via puppeteer) and `npm run test` for a repo. Extracted from
 * pre-commit-task.ts so it can be called from both the legacy pre-commit path and the
 * totality `npm run check` path.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import fs from 'fs';
import path from 'path';
import execute from '../../../../perennial-alias/js/common/execute.js';
import npmCommand from '../../../../perennial-alias/js/common/npmCommand.js';
import withServer from '../../../../perennial-alias/js/common/withServer.js';
import puppeteer from '../../../../perennial-alias/js/npm-dependencies/puppeteer.js';
import puppeteerQUnit from '../../../../perennial-alias/js/test/puppeteerQUnit.js';

export default async function runUnitTests(
  repo: string,
  monorepoRoot: string,
  options?: { outputToConsole?: boolean }
): Promise<boolean> {
  const outputToConsole = !!options?.outputToConsole;

  // scenery and phet-io-wrappers browser tests are too slow for pre-commit.
  // `npm run test` (node-side) still runs below if present.
  const runQUnit = repo !== 'scenery' && repo !== 'phet-io-wrappers';

  const qUnitOKPromise = ( async () => {
    if ( !runQUnit ) {
      return true;
    }
    const testFilePath = `${repo}/${repo}-tests.html`;
    const exists = fs.existsSync( path.join( monorepoRoot, testFilePath ) );
    if ( !exists ) {
      outputToConsole && console.log( 'unit-test: no browser unit tests detected' );
      return true;
    }

    outputToConsole && console.log( 'unit-test: testing browser QUnit' );
    const browser = await puppeteer.launch( {
      args: [ '--disable-gpu' ]
    } );

    // withServer reads process.cwd() and serves ${cwd}/${options.path}. Temporarily chdir to
    // monorepoRoot so the server serves from the monorepo root, regardless of caller CWD.
    const originalCwd = process.cwd();
    process.chdir( monorepoRoot );
    let result: { ok: boolean };
    try {
      result = await withServer( async port => {
        return puppeteerQUnit( browser, `http://localhost:${port}/${testFilePath}?ea&brand=phet-io` );
      }, { path: './' } ) as { ok: boolean };
    }
    finally {
      process.chdir( originalCwd );
      await browser.close();
    }

    outputToConsole && console.log( `unit-test: ${JSON.stringify( result, null, 2 )}` );
    if ( !result.ok ) {
      console.error( `unit tests failed in ${repo}`, result );
      return false;
    }
    return true;
  } )();

  const npmRunTestOkPromise = ( async () => {
    let hasNpmRunTest = false;
    try {
      const packageString = fs.readFileSync( path.join( monorepoRoot, repo, 'package.json' ), 'utf8' );
      const packageJSON = JSON.parse( packageString );
      if ( packageJSON.scripts?.hasOwnProperty( 'test' ) ) {
        hasNpmRunTest = true;
      }
    }
    catch{
      // no package.json or not parseable
    }
    if ( !hasNpmRunTest ) {
      return true;
    }

    outputToConsole && console.log( 'unit-test: testing "npm run test" task' );
    const output = await execute( npmCommand, [ 'run', 'test' ], path.join( monorepoRoot, repo ), { errors: 'resolve' } );
    const testPassed = output.code === 0;

    ( outputToConsole || !testPassed ) && output.stdout.length > 0 && console.log( output.stdout );
    ( outputToConsole || !testPassed ) && output.stderr.length > 0 && console.log( output.stderr );
    return testPassed;
  } )();

  const [ qUnitOK, npmRunTestOk ] = await Promise.all( [ qUnitOKPromise, npmRunTestOkPromise ] );
  outputToConsole && console.log( `unit-test: QUnit browser success: ${qUnitOK}` );
  outputToConsole && console.log( `unit-test: npm run test success: ${npmRunTestOk}` );
  return qUnitOK && npmRunTestOk;
}
