// Copyright 2025, University of Colorado Boulder

/**
 * Development server for phetsims, acting as an alternative to watch processes.
 * Files are lazily transpiled/bundled on demand and served. Ideal for debugging and iterative development/testing.
 * Entry points (*-main.js\ts, *-tests.js\ts) are bundled via esbuild.
 * Other TS files are transpiled individually. Static files are served directly.
 *
 * See https://github.com/phetsims/chipper/issues/1559
 *
 * HOW IT WORKS (Express Middleware Chain):
 * 1. Logging (optional verbose with --logLevel=verbose) & basic setup (Connection header).
 * 2. Raw Mode Check: If ?raw=true, skips TS/JS bundling, and will just transpile individual files.
 * 3. Path Rewriting: Handles directory indexes and mapping /chipper/dist/js/ to top level file.
 * 4. TS/JS Handling for -main and -tests entry points: bundles using esbuild
 * 5. Other javascript handling: if non js file is found (ts/jsx/tsx/mts), transpile that individual file with esbuild.
 * 6. Static File Serving: `express.static` serves remaining files from the filesystem.
 * 7. 404 Handler: Catches requests not handled above.
 * 8. Error Handler: Catches errors from middleware.
 *
 * NOTES:
 * - No server-side caching; files are always read from disk.
 * - By default, no files are written to disk (unless --saveToDist is provided).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import esbuild from 'esbuild';
import express from 'express';
import fs from 'fs/promises'; // eslint-disable-line phet/default-import-match-filename
import http from 'node:http';
import path from 'path';
import serveIndex from 'serve-index';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import getOption, { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';

const options = {
  port: getOptionIfProvided( 'port', 80 ),
  logLevel: getOptionIfProvided( 'logLevel', 'info' ) // or 'verbose'
};

const VERBOSE = options.logLevel === 'verbose'; // Lots of console.logs
const SAVE_TO_DIST = getOption( 'saveToDist' ); // Write files to disk for inspection
const EXTENSIONS_TO_TRANSPILE = [ 'ts', 'tsx', 'jsx', 'mts' ];

// @ts-expect-error -- __dirname workaround for ES modules
const __dirname = dirname( import.meta.url );
const STATIC_ROOT = path.join( __dirname, '../../../../' );
const DIST_DEV_SERVER_DIR = path.join( STATIC_ROOT, 'chipper/dist/dev-server/' );

// Persist generated file to disk if SAVE_TO_DIST is true
async function saveToDist( pathname: string, contents: string | Uint8Array ): Promise<void> {
  if ( !SAVE_TO_DIST ) {
    return;
  }
  const fullPath = path.join( DIST_DEV_SERVER_DIR, pathname );
  try {
    await fs.mkdir( path.dirname( fullPath ), { recursive: true } );
    await fs.writeFile( fullPath, contents );
    VERBOSE && console.log( `Saved to dist: ${fullPath}` );
  }
  catch( err ) {
    console.error( `Error saving to dist ${fullPath}:`, err );
  }
}

// --- esbuild Plugins (Hacks) ---
const simLauncherRewrite: esbuild.Plugin = {
  name: 'simLauncher-rewrite',
  setup( build ) {
    build.onLoad( { filter: /simLauncher.ts$/ }, async ( { path } ) => {
      let text = await fs.readFile( path, 'utf8' );
      text = text.replace( '\'js\'', '\'ts\'' );
      return { contents: text, loader: 'ts' };
    } );
  }
};

const himalayaRewrite: esbuild.Plugin = {
  name: 'himalaya-rewrite',
  setup( build ) {
    build.onLoad( { filter: /himalaya-1.1.0.js$/ }, async ( { path } ) => {
      let text = await fs.readFile( path, 'utf8' );
      text = text.replace(
        '(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.himalaya = f()}})',
        '( function( f ) {self.himalaya = f();})'
      );
      return { contents: text, loader: 'js' };
    } );
  }
};

const peggyRewrite: esbuild.Plugin = {
  name: 'peggy-rewrite',
  setup( build ) {
    build.onLoad( { filter: /peggy-3.0.2.js$/ }, async ( { path } ) => {
      let text = await fs.readFile( path, 'utf8' );
      text = text.replace(
        'function(e,u){"object"==typeof exports&&"undefined"!=typeof module?module.exports=u():"function"==typeof define&&define.amd?define(u):(e="undefined"!=typeof globalThis?globalThis:e||self).peggy=u()}',
        '( function( e,u ) {self.peggy = u();})'
      );
      return { contents: text, loader: 'js' };
    } );
  }
};

function isRaw( query: Record<string, unknown> ): boolean {
  return query.hasOwnProperty( 'raw' ) && query.raw !== 'false';
}

// Entry point paths that should be bundled into a single resource before sending (never bundle if serving raw)
function isBundleEntryPoint( path: string, raw: boolean ): boolean {
  return !raw && ( path.endsWith( '-main.ts' ) || path.endsWith( '-tests.ts' ) ||
                   path.endsWith( '-main.js' ) || path.endsWith( '-tests.js' ) );
}

// --- esbuild Operations ---

// Bundles a TS (or JS) entry point using esbuild, throws an error on failure.
async function bundleFile( filePath: string, originalPathname: string ): Promise<string> {
  const start = Date.now();
  try {
    const result = await esbuild.build( {
      entryPoints: [ filePath ],
      bundle: true,
      format: 'esm',
      write: false, // We handle writing/sending the response
      sourcemap: 'inline', // Keep source maps inline for dev
      plugins: [ simLauncherRewrite, himalayaRewrite, peggyRewrite ],
      absWorkingDir: STATIC_ROOT // Needed to resolve files relative to the entry point's directory
    } );
    const output = result.outputFiles[ 0 ];
    VERBOSE && console.log( `Bundled: ${filePath} in ${Date.now() - start}ms` );
    await saveToDist( originalPathname, output.contents );

    return output.text;
  }
  catch( err: unknown ) {
    console.error( 'Esbuild bundling error:', err );
    throw err;
  }
}

// Transpiles a single TS file in-memory, throws an error on failure.
async function transpileTS( tsCode: string, filePath: string, originalPathname: string ): Promise<string> {
  const start = Date.now();
  try {
    const loader = filePath.endsWith( 'tsx' ) ? 'tsx' :
                   filePath.endsWith( 'jsx' ) ? 'jsx' :
                   'ts';
    const result = await esbuild.transform( tsCode, {
      loader: loader,
      format: 'esm', // Output ESM
      sourcemap: 'inline', // Keep source maps inline for dev
      target: 'esnext' // Use modern JS features
    } );
    VERBOSE && console.log( `Transpiled ${filePath} in ${Date.now() - start}` );

    await saveToDist( originalPathname, result.code );
    return result.code;
  }
  catch( err: unknown ) {
    console.error( 'Esbuild transform error:', err );
    throw err;
  }
}

// --- Express App Setup ---

const app = express();

// Settings for disabling cache
app.set( 'etag', false );
app.disable( 'view cache' );

// --- Middleware ---

// 1. Basic Logging & Setup Middleware
app.use( ( req, res, next ) => {

  // Disable cache:
  res.setHeader( 'Surrogate-Control', 'no-store' );
  res.setHeader( 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate' );
  res.setHeader( 'Expires', '0' );

  // Set 'Connection: close' header like the original server
  // This disables keep-alive, might impact performance slightly but matches original behavior.
  res.setHeader( 'Connection', 'close' );

  if ( VERBOSE ) {
    const startTime = process.hrtime();
    console.log( `Request: ${req.method} ${req.originalUrl}` );

    res.on( 'finish', () => {
      const duration = process.hrtime( startTime );
      const durationMs = ( duration[ 0 ] * 1e9 + duration[ 1 ] ) / 1e6;
      console.log( `Response: ${res.statusCode} ${req.originalUrl} (${durationMs.toFixed( 2 )}ms)` );
    } );
  }
  next();
} );

// 3. Path Rewriting Middleware (from chipper/dist to top level file)
app.use( async ( req, res, next ) => {
  if ( isRaw( req.query ) ) {
    VERBOSE && console.log( `Raw mode request for ${req.path}, skipping dynamic handling.` );
  }

  let currentPath = req.path;
  const originalPath = currentPath; // Keep for reference

  // Requests for /chipper/dist/js/ are rerouted to the source *.ts or *.js file
  const chipperDistPrefix = '/chipper/dist/js/';
  if ( currentPath.startsWith( chipperDistPrefix ) ) {
    const newPath = '/' + currentPath.substring( chipperDistPrefix.length );
    VERBOSE && console.log( `Rewriting from chipper dist:\t${originalPath} to ${newPath}` );
    currentPath = newPath;
  }

  // This should be AFTER the chipper/dist mapping above.
  if ( currentPath.endsWith( '.js' ) ) {
    try {
      await fs.access( path.join( STATIC_ROOT, currentPath ) );
    }
    catch( e ) {
      let found = false;
      for ( const sourceExt of EXTENSIONS_TO_TRANSPILE ) {
        const ext = `.${sourceExt}`;
        const potentialSourceFilePath = currentPath.slice( 0, -3 ) + `${ext}`; // Replace .js with .ts, etc.
        try {
          await fs.access( path.join( STATIC_ROOT, potentialSourceFilePath ) );
          VERBOSE && console.log( `Mapped js file to ext: ${ext}: ${potentialSourceFilePath}` );
          currentPath = potentialSourceFilePath;
          found = true;
          break; // Stop looking once found and handled
        }
        catch( err: unknown ) {
          if ( err instanceof Error && !err.message.includes( 'ENOENT' ) ) {

            // Error reading a potential source file (not just 'not found')
            next( err ); // Pass this error on
            break;
          }
          else {
            console.log( e );
          }

          // Source file with this extension not found, continue loop
        }
      }
      if ( !found ) {
        VERBOSE && console.log( `Could not map js file to another ext: ${currentPath}` );
      }
    }
  }

  // Update req.url if it changed, so subsequent middleware see the rewritten path
  // This is a common pattern, though modifying req objects needs care.
  if ( currentPath !== req.path ) {
    const parsedUrl = new URL( req.url, `http://${req.headers.host}` );
    req.url = currentPath + parsedUrl.search; // Keep query params
  }

  next();
} );

// 4. Dynamic JavaScript bundling/transpiling Middleware
app.use( async ( req, res, next ) => {

  // Skip if raw mode was detected earlier
  const raw = isRaw( req.query );

  const requestedPath = req.path; // Use the potentially rewritten path
  const filePath = path.join( STATIC_ROOT, requestedPath );
  const ext = path.extname( filePath ).toLowerCase();
  const extNoPeriod = ext.slice( 1 );

  // --- Handle Bundling/Transpiling requests ---
  if ( isBundleEntryPoint( requestedPath, raw ) ||
       EXTENSIONS_TO_TRANSPILE.includes( extNoPeriod ) ) {
    VERBOSE && console.log( 'Bundle/Transpile need detected:', filePath );
    try {
      if ( isBundleEntryPoint( requestedPath, raw ) ) {
        const text = await bundleFile( filePath, requestedPath );
        res.type( 'application/javascript' ).send( text );
      }
      else {
        const tsData = await fs.readFile( filePath, 'utf-8' );
        const text = await transpileTS( tsData, filePath, requestedPath );
        res.type( 'application/javascript' ).send( text );
      }
    }
    catch( err: unknown ) {
      if ( err instanceof Error && err.message.includes( 'ENOENT' ) ) {
        VERBOSE && console.log( `File not found, cannot bundle/transpile: ${filePath}, passing to next handler.` );
        next(); // Let static or 404 handle it
      }
      else {
        next( err ); // Pass other errors (like esbuild errors) to the error handler
      }
    }
    return Promise.resolve(); // Handled
  }

  // If there is no file for bundling/transpiling, pass to the next (express.static)
  next();
  return Promise.resolve();
} );

// 5. Static File Serving
// Serve files from the static root directory.
// This runs *after* the dynamic TS/JS handler.
app.use( express.static( STATIC_ROOT, {
  etag: false // Helps prevent caching
} ) );

// 6. If static didn't find a file (esp. index.html in a dir), serveIndex will check if it's a directory and list contents.
app.use( serveIndex( STATIC_ROOT, { icons: true } ) ); // Optional: adds icons

// 7. 404 Handler - If nothing above matched
app.use( ( req, res ) => {
  VERBOSE && console.error( `404 Not Found: ${req.path}` );
  res.status( 404 ).type( 'text/plain' ).send( 'File not found.' );
} );

// 8. Error Handling Middleware (must have 4 arguments)
app.use( ( error: Error, req: express.Request, res: express.Response, next: express.NextFunction ) => {
  console.error( `Server Error for ${req.path}:`, error.message || error );

  // Avoid sending detailed stack traces to the client in production
  res.status( 500 ).type( 'text/plain' ).send( 'Internal Server Error' );
} );

// --- Start Server ---
const server = http.createServer( app ); // Create HTTP server with express app

// Handle server errors (e.g., port already in use)
server.on( 'error', ( err: Error ) => {
  if ( err.message.includes( 'EADDRINUSE' ) ) {
    console.error( `Error: Port ${options.port} is already in use. Try specifying a different port with --port=NUMBER` );
  }
  else {
    console.error( 'Server startup error:', err );
  }
  process.exit( 1 );
} );

server.listen( options.port, () => {
  console.log( `PhET Development Server listening at http://localhost:${options.port}/` );
  console.log( `Serving files from: ${STATIC_ROOT}` );
  SAVE_TO_DIST && console.log( `Will save generated files to: ${DIST_DEV_SERVER_DIR}` );
} );