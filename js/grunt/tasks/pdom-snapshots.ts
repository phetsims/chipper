// Copyright 2026, University of Colorado Boulder

/**
 * Capture PDOM HTML snapshots for a list of simulations and screens using the interact daemon.
 *
 * This script will load each screen of each sim in the data list interactive-description, grab the PDOM
 * HTML and save it to a text file.
 *
 * Purpose and intended use:
 * This task supports automated regression checks for the Parallel DOM (PDOM).
 * Run it once before a change to create a baseline, then run it again after the change
 * to create a second snapshot set. Compare the two output directories to identify
 * PDOM text placement changes (regressions or intentional shifts).
 *
 * Typical workflow:
 * 1. `grunt pdom-snapshots --run=run-1`
 * 2. Make your change.
 * 3. `grunt pdom-snapshots --run=run-2`
 * 4. Diff `chipper/dom-snapshots/run-1` vs `chipper/dom-snapshots/run-2`:
 *    `diff -ru dom-snapshots/run-1 dom-snapshots/run-2 >> output.diff`
 *
 *    You can then review output.diff in webstorm to get nice comparisons for each file.
 *
 * Example:
 *   grunt pdom-snapshots --run=run-1
 *
 * Prerequisites:
 * 1. Run `npx playwright install` in chipper.
 * 2. Run your normal development server for sims.
 * 3. Start the daemon: `grunt interact-daemon --port`.
 * 4. Make sure the daemon's sim port matches your dev server (use --port).
 * 5. Then run `grunt pdom-snapshots`.
 *
 * Options:
 *   --sims=sim-a,sim-b                  Comma-separated list of sims (overrides sim list file)
 *   --simList=interactive-description   Perennial-alias data list name (default: interactive-description)
 *   --run=run-1                         Output folder name under chipper/dom-snapshots (required)
 *   --simRoot=..                        Root that contains sim repos (default: ../ relative to chipper)
 *   --perennialRoot=../perennial-alias  Root that contains perennial-alias (default: ../perennial-alias relative to chipper)
 *   --daemonHost=localhost              Daemon host (default: localhost)
 *   --daemonPort=3001                   Daemon port (default: 3001)
 *   --host=http://localhost             Sim host (default: http://localhost)
 *   --port=8080                         Sim port (default: 8080)
 *   --brand=phet                        Brand (default: phet)
 *   --query=foo=1&bar=2                 Extra query params
 *   --continueOnError                   Continue even if a sim/screen fails
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
import http from 'http';
import path from 'path';
import getOption, { getOptionIfProvided, isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';

const DEFAULT_DAEMON_HOST = 'localhost';
const DEFAULT_DAEMON_PORT = 3001;
const DEFAULT_HOST = 'http://localhost';
const DEFAULT_PORT = 8080;
const DEFAULT_BRAND = 'phet';
// Keep in sync with interact-daemon defaults for consistent sim startup behavior.
const DEFAULT_QUERY_FLAGS = [ 'ea', 'debugger', 'phetioStandalone', 'logSimLifecycle', 'logInteractiveDescriptionResponses', 'audio=disabled' ] as const;

// Normalize host to avoid double slashes when building URLs.
function normalizeHost( host: string ): string {
  return host.endsWith( '/' ) ? host.slice( 0, -1 ) : host;
}

// Parse boolean-ish grunt options like --continueOnError=false.
function getBooleanOption( key: string, defaultValue: boolean ): boolean {
  if ( !isOptionKeyProvided( key ) ) {
    return defaultValue;
  }
  const value = getOption( key );
  if ( typeof value === 'boolean' ) {
    return value;
  }
  if ( typeof value === 'string' ) {
    const normalized = value.toLowerCase();
    return !( normalized === 'false' || normalized === '0' || normalized === 'no' );
  }
  return Boolean( value );
}

// Build a runnable sim URL for a given screen.
function buildTargetUrl( sim: string, screen: number, options: {
  host: string;
  port: number;
  brand: string;
  extraQuery: string;
} ): string {
  const baseHost = normalizeHost( options.host );
  const hostWithPort = options.port === 80 ? baseHost : `${baseHost}:${options.port}`;

  const queryParts = [
    `brand=${encodeURIComponent( options.brand )}`,
    `screens=${encodeURIComponent( `${screen}` )}`,
    ...DEFAULT_QUERY_FLAGS
  ];

  if ( options.extraQuery.trim().length > 0 ) {
    options.extraQuery.split( '&' )
      .map( part => part.trim() )
      .filter( part => part.length > 0 )
      .forEach( part => queryParts.push( part ) );
  }

  return `${hostWithPort}/${encodeURIComponent( sim )}/${encodeURIComponent( sim )}_en.html?${queryParts.join( '&' )}`;
}

// Read a perennial data list (one repo per line).
function readSimList( perennialRoot: string, listName: string ): string[] {
  const listPath = path.join( perennialRoot, 'data', listName );
  if ( !fs.existsSync( listPath ) ) {
    throw new Error( `Sim list not found: ${listPath}` );
  }
  return fs.readFileSync( listPath, 'utf8' )
    .split( /\r?\n/ )
    .map( line => line.trim() )
    .filter( line => line.length > 0 && !line.startsWith( '#' ) );
}

// Determine number of screens from package.json screenNameKeys, defaulting to 1.
function getScreenCount( simRoot: string, sim: string ): number {
  const packageJsonPath = path.join( simRoot, sim, 'package.json' );
  if ( !fs.existsSync( packageJsonPath ) ) {
    return 0;
  }
  const packageObject = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
  const screenNameKeys = packageObject?.phet?.screenNameKeys || packageObject?.screenNameKeys;
  if ( Array.isArray( screenNameKeys ) && screenNameKeys.length > 0 ) {
    return screenNameKeys.length;
  }
  return 1;
}

// Resolve chipper root when task is executed from another repo.
function resolveChipperRoot(): string {
  const cwd = process.cwd();
  const localInteract = path.join( cwd, 'js', 'grunt', 'tasks', 'interact.ts' );
  if ( fs.existsSync( localInteract ) ) {
    return cwd;
  }
  return path.resolve( cwd, '..', 'chipper' );
}

// Lightweight HTTP client for interact-daemon.
function makeRequest( host: string, port: number, requestPath: string, method: string, body?: string ): Promise<string> {
  return new Promise( ( resolve, reject ) => {
    const options = {
      hostname: host,
      port: port,
      path: requestPath,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request( options, res => {
      let data = '';
      res.on( 'data', chunk => {
        data += chunk;
      } );
      res.on( 'end', () => {
        if ( res.statusCode && res.statusCode >= 200 && res.statusCode < 300 ) {
          resolve( data );
        }
        else {
          reject( new Error( `HTTP ${res.statusCode}: ${data}` ) );
        }
      } );
    } );

    req.on( 'error', err => {
      reject( new Error( `Failed to connect to daemon at ${host}:${port}. Is the daemon running? (${err.message})` ) );
    } );

    if ( body ) {
      req.write( body );
    }
    req.end();
  } );
}

export const pdomSnapshotsPromise = ( async () => {
  const runLabel = getOptionIfProvided<string>( 'run', '' );
  assert( runLabel.length > 0, 'Missing required --run option (e.g., --run=run-1)' );
  const daemonHost = getOptionIfProvided<string>( 'daemonHost', DEFAULT_DAEMON_HOST );
  const daemonPort = Number( getOptionIfProvided( 'daemonPort', `${DEFAULT_DAEMON_PORT}` ) );
  const simHost = getOptionIfProvided<string>( 'host', DEFAULT_HOST );
  const simPort = Number( getOptionIfProvided( 'port', `${DEFAULT_PORT}` ) );
  const brand = getOptionIfProvided<string>( 'brand', DEFAULT_BRAND );
  const extraQuery = getOptionIfProvided<string>( 'query', '' );
  const continueOnError = getBooleanOption( 'continueOnError', true );

  const chipperRoot = resolveChipperRoot();
  const simRoot = getOptionIfProvided<string>( 'simRoot', path.resolve( chipperRoot, '..' ) );
  const perennialRoot = getOptionIfProvided<string>( 'perennialRoot', path.resolve( chipperRoot, '..', 'perennial-alias' ) );
  const simListName = getOptionIfProvided<string>( 'simList', 'interactive-description' );
  const outDir = path.join( chipperRoot, 'dom-snapshots', runLabel );

  const simsArg = getOptionIfProvided<string>( 'sims', '' );
  // Prefer explicit --sims, otherwise fall back to perennial data list.
  const sims = simsArg.length > 0 ?
               simsArg.split( ',' ).map( s => s.trim() ).filter( s => s.length > 0 ) :
               readSimList( perennialRoot, simListName );
  assert( sims.length > 0, 'No sims found. Provide --sims or ensure the sim list file is non-empty.' );

  fs.mkdirSync( outDir, { recursive: true } );

  let anyFailed = false;

  for ( const sim of sims ) {
    const screenCount = getScreenCount( simRoot, sim );
    if ( screenCount <= 0 ) {
      console.warn( `No screens configured for ${sim}` );
      anyFailed = true;
      if ( !continueOnError ) { break; }
      continue;
    }

    for ( let screen = 1; screen <= screenCount; screen++ ) {
      const url = buildTargetUrl( sim, screen, {
        host: simHost,
        port: simPort,
        brand: brand,
        extraQuery: extraQuery
      } );

      let response = '';
      try {
        // Sequentially navigate then fetch PDOM HTML so the daemon can wait for readiness.
        response = await makeRequest(
          daemonHost,
          daemonPort,
          '/cmd',
          'POST',
          JSON.stringify( {
            commands: [
              { navigate: url },
              { peekHtml: true }
            ],
            continueOnError: continueOnError
          } )
        );
      }
      catch( e ) {
        const message = e instanceof Error ? e.message : String( e );
        console.warn( `[${sim} screen ${screen}] interact failed: ${message}` );
        anyFailed = true;
        if ( !continueOnError ) { break; }
        continue;
      }

      let pdomHtml = '';
      try {
        const parsed = JSON.parse( response );
        const peekResult = Array.isArray( parsed ) ? parsed.find( ( r: { pdomHtml?: string } ) => r.pdomHtml ) : null;
        pdomHtml = peekResult?.pdomHtml || '';
      }
      catch( e ) {
        console.warn( `[${sim} screen ${screen}] Failed to parse JSON output, saving raw output.` );
        pdomHtml = '';
      }

      const outFile = path.join( outDir, `${sim}__screen-${screen}.txt` );
      if ( pdomHtml.length > 0 ) {
        // Simple formatting to make diffs easier (no external dependency).
        const formatted = pdomHtml.replace( /></g, '>\n<' );
        fs.writeFileSync( outFile, `${formatted}\n`, 'utf8' );
      }
      else {
        fs.writeFileSync( outFile, `${response}\n`, 'utf8' );
      }
    }
  }

  if ( anyFailed && !continueOnError ) {
    throw new Error( 'One or more snapshots failed' );
  }
} )();
