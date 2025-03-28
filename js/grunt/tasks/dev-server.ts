// Copyright 2025, University of Colorado Boulder
// Rewritten using Express.js for idiomatic structure

/**
 * Development server for phetsims, acting as an alternative to watch processes.
 * Files are lazily transpiled/bundled on demand and served. Ideal for debugging.
 * Entry points (*-main.js, *-tests.js, *-main.ts, *-tests.ts) are bundled via esbuild.
 * Other TS files are transpiled individually. Static files are served directly.
 *
 * See https://github.com/phetsims/chipper/issues/1559
 *
 * HOW IT WORKS (Express Middleware Chain):
 * 1. Logging (optional verbose) & basic setup (Connection header).
 * 2. Raw Mode Check: If ?raw=true, skips TS/JS processing.
 * 3. Path Rewriting: Handles directory indexes and /chipper/dist/js/ aliasing.
 * 4. TS/JS Handling:
 *    a. If *.ts: Bundles entry points, transpiles others using esbuild.
 *    b. If *.js: Bundles entry points. If not an entry point and not found,
 *       attempts to find and transpile/bundle corresponding .ts/.tsx/.jsx/.mts
 * 5. Static File Serving: `express.static` serves remaining files from the filesystem.
 * 6. 404 Handler: Catches requests not handled above.
 * 7. Error Handler: Catches errors from middleware.
 *
 * NOTES:
 * - No server-side caching; files are always read from disk.
 * - By default, no files are written to disk (unless SAVE_TO_DIST is true).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: remove this, https://github.com/phetsims/chipper/issues/1572
/* eslint-disable @typescript-eslint/no-explicit-any */

import esbuild from 'esbuild';
import express from 'express'; // Import express
import fs from 'fs/promises'; // eslint-disable-line phet/default-import-match-filename
import http from 'node:http'; // Still needed for Server type hint if desired, but not core functionality
import path from 'path';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';

const options = {
  port: getOptionIfProvided( 'port', 80 ),
  logLevel: getOptionIfProvided( 'logLevel', 'info' ) // or 'verbose'
};

const VERBOSE = options.logLevel === 'verbose'; // Lots of console.log
const SAVE_TO_DIST = false; // Write files to disk for inspection

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
// NOTE: These are kept largely the same as they are specific esbuild configurations.

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


// --- esbuild Operations ---

// Bundles a TS (or JS) entry point using esbuild.
// Throws an error on failure.
async function bundleFile( filePath: string, originalPathname: string ): Promise<{ text: string }> {
  const start = Date.now();
  try {
    const result = await esbuild.build( {
      entryPoints: [ filePath ],
      bundle: true,
      format: 'esm',
      write: false, // We handle writing/sending the response
      sourcemap: 'inline', // Keep source maps inline for dev
      plugins: [ simLauncherRewrite, himalayaRewrite, peggyRewrite ],
      // Needed to resolve files relative to the entry point's directory
      absWorkingDir: STATIC_ROOT
    } );
    const output = result.outputFiles[ 0 ];
    VERBOSE && console.log( `Bundled: ${filePath} in ${Date.now() - start}ms` );
    await saveToDist( originalPathname, output.contents );

    return { text: output.text }; // Return both buffer and text
  }
  catch( err: any ) {
    console.error( '\nEsbuild bundling error:', err );
    // Re-throw a more specific error for the error handler
    const buildError = new Error( `Build failed for ${filePath}:\n${err.message}` );
    ( buildError as any ).buildResult = err; // Attach original error if needed
    throw buildError;
  }
}

// Transpiles a single TS file in-memory.
// Throws an error on failure.
async function transpileTS( tsCode: string, filePath: string, originalPathname: string ): Promise<{ text: string }> {
  VERBOSE && console.log( `Transpiling TS file: ${filePath}` );
  try {
    const result = await esbuild.transform( tsCode, {
      loader: 'ts',
      format: 'esm', // Output ESM
      sourcemap: 'inline', // Keep source maps inline for dev
      target: 'esnext' // Use modern JS features
    } );
    VERBOSE && console.log( 'Transpilation successful' );
    await saveToDist( originalPathname, result.code );
    return { text: result.code };
  }
  catch( err: any ) {
    console.error( 'Esbuild transform error:', err );
    // Re-throw a more specific error for the error handler
    const transformError = new Error( `Transform failed for ${filePath}:\n${err.message}` );
    ( transformError as any ).transformResult = err; // Attach original error if needed
    throw transformError;
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

// 2. Raw Mode Check
// If '?raw=true', skip dynamic processing/path mapping/bundling and let express.static handle it.
app.use( ( req, res, next ) => {
  if ( req.query.raw === 'true' ) {
    VERBOSE && console.log( `Raw mode request for ${req.path}, skipping dynamic handling.` );
    // Need to let static handler serve the raw .ts/.js file
    // We achieve this by simply calling next() here and letting the static handler run.
    // Ensure the static handler is configured to serve .ts files if needed,
    // though usually it only serves known web types. We might need to explicitly set
    // the content type later if express.static doesn't handle .ts well.
  }
  next(); // Continue if not raw mode
} );

// 3. Path Rewriting Middleware
app.use( async ( req, res, next ) => {
  let currentPath = req.path;
  const originalPath = currentPath; // Keep for reference

  // Handle // in URLs like the original
  // Express typically normalizes paths, but req.url might retain it.
  if ( req.url.startsWith( '//' ) ) {
    req.url = req.url.replace( /^\/{2,}/, '/' );
    // Update currentPath based on the potentially modified req.url
    try {
      currentPath = new URL( req.url, `http://${req.headers.host}` ).pathname;
    }
    catch( e ) { /* ignore potential URL parsing errors */ }
  }


  // If the request is for a directory, implicitly serve index.html.
  // express.static can do this, but we replicate it here for clarity
  // and to potentially handle it before the /chipper/dist/js rewrite.
  if ( currentPath.endsWith( '/' ) ) {
    currentPath += 'index.html';
  }
  else {
    // Check if it's a directory path without a trailing slash
    const potentialDirPath = path.join( STATIC_ROOT, currentPath );
    try {
      const stats = await fs.stat( potentialDirPath );
      if ( stats.isDirectory() ) {
        // Redirect to path with trailing slash to simplify relative paths
        // Or just serve index.html directly? Let's serve index.html directly.
        currentPath += '/index.html';
        VERBOSE && console.log( `Directory request: serving ${currentPath}` );
      }
    }
    catch( e: any ) {
      // If stat fails (likely ENOENT), it's not a directory, proceed normally.
      if ( e.code !== 'ENOENT' ) {
        console.warn( `Error stating path ${potentialDirPath}: ${e.message}` );
      }
    }
  }

  // Requests for /chipper/dist/js/ are rerouted to the source *.ts or *.js file
  const chipperDistPrefix = '/chipper/dist/js/';
  if ( currentPath.startsWith( chipperDistPrefix ) ) {
    const newPath = '/' + currentPath.substring( chipperDistPrefix.length );
    VERBOSE && console.log( `Rewriting ${originalPath} to ${newPath}` );
    currentPath = newPath;
  }
  // TODO: The original code had another rewrite condition:  https://github.com/phetsims/chipper/issues/1572
  // if ( pathname.includes( match ) ) { ... return `/alternative/js/${relativePath}`; }
  // This seemed less common, decide if it's needed. Assuming not for now.

  // Update req.path if it changed, so subsequent middleware see the rewritten path
  if ( currentPath !== req.path ) {
    // req.path = currentPath;
    // Also update req.url to be consistent (important for express.static)
    // This is a common pattern, though modifying req objects needs care.
    const parsedUrl = new URL( req.url, `http://${req.headers.host}` );
    parsedUrl.pathname = currentPath;
    req.url = parsedUrl.pathname + parsedUrl.search; // Keep query params
  }

  next();
} );

// 4. TS/JS Dynamic Handling Middleware
app.use( async ( req, res, next ) => {

  // Skip if raw mode was detected earlier
  if ( req.query.raw === 'true' ) {
    return next();
  }

  const requestedPath = req.path; // Use the potentially rewritten path
  const filePath = path.join( STATIC_ROOT, requestedPath );
  const ext = path.extname( filePath ).toLowerCase();

  // --- Handle TypeScript requests ---
  if ( ext === '.ts' ) {
    VERBOSE && console.log( 'TS file request detected:', filePath );
    try {
      // Check existence first
      await fs.access( filePath, fs.constants.R_OK );

      if ( filePath.endsWith( '-main.ts' ) || filePath.endsWith( '-tests.ts' ) ) {
        const { text } = await bundleFile( filePath, requestedPath );
        res.type( 'application/javascript' ).send( text );
      }
      else {
        const tsData = await fs.readFile( filePath, 'utf-8' );
        const { text } = await transpileTS( tsData, filePath, requestedPath );
        res.type( 'application/javascript' ).send( text );
      }
    }
    catch( err: any ) {
      if ( err.code === 'ENOENT' ) {
        VERBOSE && console.log( `TS file not found: ${filePath}, passing to next handler.` );
        next(); // Let static or 404 handle it
      }
      else {
        next( err ); // Pass other errors (like esbuild errors) to the error handler
      }
    }
    return Promise.resolve(); // Handled
  }

  // --- Handle JavaScript requests (with potential TS fallback) ---
  if ( ext === '.js' ) {

    // If it's an entry point, always try to bundle it (JS or TS source)
    if ( requestedPath.endsWith( '-main.js' ) || requestedPath.endsWith( '-tests.js' ) ) {
      VERBOSE && console.log( 'JS entry point detected, attempting to bundle:', filePath );
      try {
        // Try bundling the JS file directly
        await fs.access( filePath, fs.constants.R_OK );
        const { text } = await bundleFile( filePath, requestedPath );
        res.type( 'application/javascript' ).send( text );
      }
      catch( jsErr: any ) {
        if ( jsErr.code === 'ENOENT' ) {
          // JS not found, try TS entry point
          const tsFilePath = filePath.replace( /\.js$/, '.ts' );
          VERBOSE && console.log( `JS entry point not found, trying ${tsFilePath}` );
          try {
            await fs.access( tsFilePath, fs.constants.R_OK );
            const { text } = await bundleFile( tsFilePath, requestedPath ); // Bundle TS but serve as original JS path
            res.type( 'application/javascript' ).send( text );
          }
          catch( tsErr: any ) {
            if ( tsErr.code === 'ENOENT' ) {
              VERBOSE && console.log( `Neither JS nor TS entry point found: ${filePath}` );
              next(); // Let 404 handle it
            }
            else {
              next( tsErr ); // Error bundling TS file
            }
          }
        }
        else {
          next( jsErr ); // Error accessing JS file (not ENOENT) or bundling JS file
        }
      }
      return Promise.resolve(); // Handled (or error passed)
    }

    // If not an entry point, try serving static JS, then fallback to transpiling TS/TSX/JSX
    try {
      // Check if static JS file exists
      await fs.access( filePath, fs.constants.R_OK );
      // If it exists, do nothing here - let express.static handle it.
      VERBOSE && console.log( `Static JS file exists: ${filePath}, passing to express.static` );
      next();
    }
    catch( jsErr: any ) {
      if ( jsErr.code === 'ENOENT' ) {
        // Static JS file not found, look for corresponding TS/etc.
        VERBOSE && console.log( `Static JS file not found: ${filePath}. Looking for TS/JSX source...` );
        const possibleExtensions = [ 'ts', 'tsx', 'jsx', 'mts' ]; // Order matters?
        let found = false;
        for ( const sourceExt of possibleExtensions ) {
          const sourceFilePath = filePath.slice( 0, -3 ) + `.${sourceExt}`; // Replace .js with .ts, etc.
          try {
            const contents = await fs.readFile( sourceFilePath, 'utf-8' );
            VERBOSE && console.log( `Found source file: ${sourceFilePath}, transpiling...` );
            const { text } = await transpileTS( contents, sourceFilePath, requestedPath ); // Serve as original .js path
            res.type( 'application/javascript' ).send( text );
            found = true;
            break; // Stop looking once found and handled
          }
          catch( sourceErr: any ) {
            if ( sourceErr.code !== 'ENOENT' ) {
              // Error reading a potential source file (not just 'not found')
              next( sourceErr ); // Pass this error on
              return Promise.resolve(); // Stop processing this request
            }
            // Source file with this extension not found, continue loop
          }
        }

        if ( !found ) {
          // Neither static JS nor any source equivalent found
          VERBOSE && console.log( `No static JS or TS/JSX source found for ${requestedPath}` );
          next(); // Let 404 handler deal with it
        }
      }
      else {
        // Other error accessing the static JS file
        next( jsErr );
      }
    }
    return Promise.resolve(); // Handled (either passed to static or transpiled)
  }

  // If not .ts or .js (or raw mode handled it), pass to the next middleware (express.static)
  next();
  return Promise.resolve();
} );

// 5. Static File Serving
// Serve files from the static root directory.
// This runs *after* the dynamic TS/JS handler.
app.use( express.static( STATIC_ROOT, {
  etag: false // Helps prevent caching
} ) );

// 6. 404 Handler - If nothing above matched
app.use( ( req, res ) => {
  VERBOSE && console.error( `404 Not Found: ${req.path}` );
  res.status( 404 ).type( 'text/plain' ).send( 'File not found.' );
} );

// 7. Error Handling Middleware (must have 4 arguments)
app.use( ( err: any, req: express.Request, res: express.Response, next: express.NextFunction ) => {
  console.error( `Server Error for ${req.path}:`, err.message || err ); // Log the error message
  // Avoid sending detailed stack traces to the client in production
  const message = err.message && ( err.message.startsWith( 'Build failed' ) || err.message.startsWith( 'Transform failed' ) )
                  ? err.message // Show esbuild errors directly
                  : 'Internal Server Error';
  res.status( 500 ).type( 'text/plain' ).send( message );
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