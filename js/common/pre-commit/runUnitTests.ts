// Copyright 2026, University of Colorado Boulder

/**
 * Run browser QUnit tests (via puppeteer) and `npm run test` for a repo. Extracted from
 * pre-commit-task.ts so it can be called from both the legacy pre-commit path and the
 * totality `npm run check` path.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import execute from '../../../../perennial-alias/js/common/execute.js';
import npmCommand from '../../../../perennial-alias/js/common/npmCommand.js';
import puppeteer from '../../../../perennial-alias/js/npm-dependencies/puppeteer.js';
import puppeteerQUnit from '../../../../perennial-alias/js/test/puppeteerQUnit.js';

// Ask the OS for a free ephemeral port by letting it bind :0, reading the port back, then closing.
// Race window before the caller binds is small and acceptable here.
function getFreePort(): Promise<number> {
  return new Promise( ( resolve, reject ) => {
    const s = net.createServer();
    s.unref();
    s.on( 'error', reject );
    s.listen( 0, () => {
      const port = ( s.address() as net.AddressInfo ).port;
      s.close( () => resolve( port ) );
    } );
  } );
}

/**
 * Spawn the chipper dev-server (which transpiles/bundles on-the-fly) on a free port and
 * resolve once it's listening. Returns the child process and the port.
 */
async function startDevServer( monorepoRoot: string ): Promise<{ child: ReturnType<typeof spawn>; port: number }> {
  const port = await getFreePort();
  const sageScript = '../perennial-alias/bin/sage';
  const devServerScript = 'js/grunt/tasks/dev-server.ts';

  const child = spawn( 'bash', [ sageScript, 'run', devServerScript, `--port=${port}` ], {
    cwd: path.join( monorepoRoot, 'chipper' ),
    stdio: [ 'ignore', 'pipe', 'pipe' ]
  } );

  await new Promise<void>( ( resolve, reject ) => {
    let settled = false;
    const onData = ( chunk: Buffer ) => {
      if ( !settled && chunk.toString().includes( 'listening' ) ) {
        settled = true;
        resolve();
      }
    };
    child.stdout.on( 'data', onData );
    child.stderr.on( 'data', onData ); // some builds route the listening message to stderr
    child.on( 'error', error => {
      if ( !settled ) {
        settled = true;
        reject( error );
      }
    } );
    child.on( 'exit', code => {
      if ( !settled ) {
        settled = true;
        reject( new Error( `dev-server exited before becoming ready (code ${code})` ) );
      }
    } );
  } );

  return { child: child, port: port };
}

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

    outputToConsole && console.log( 'unit-test: testing browser QUnit via dev-server' );

    // Launch the chipper dev-server so the browser gets freshly-bundled test code from source,
    // instead of reading stale chipper/dist/js/ from a previous build.
    const { child: devServer, port } = await startDevServer( monorepoRoot );

    const browser = await puppeteer.launch( {
      args: [ '--disable-gpu' ]
    } );

    let result: { ok: boolean };
    try {
      result = await puppeteerQUnit( browser, `http://localhost:${port}/${testFilePath}?ea&brand=phet-io` ) as { ok: boolean };
    }
    finally {
      await browser.close();
      devServer.kill();
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
