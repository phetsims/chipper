// Copyright 2025, University of Colorado Boulder

/**
 * Serve for phetsims development. This can be used as an alternative to the swc/transpiler watch processes. Files
 * are lazily converted to *.js on the fly, and served to the browser. This is useful for debugging and development.
 * Sims and other runnables with -main.js, -tests.js, -main.ts, -tests.ts files are bundled with esbuild for speed.
 *
 * See https://github.com/phetsims/chipper/issues/1559 for the initial development issue.
 *
 * OVERVIEW:
 * 1. mainly a static server
 * 2. If the request is for a *.ts file, then transpile it to a *.js file and return it.
 *    a. If the request is for a *-main.ts or *-tests.ts file, then bundle it with esbuild and return it.
 *    b. If the request is for a *.ts file that is not a *-main.ts file, then transpile it in-memory (single file) and return it.
 * 3. If the request is found on the filesystem (say, a *.js or *.png file), return it.
 *
 * NOTES:
 * - There is no caching, files are always read from disk
 * - By default, no files are written to the disk
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import esbuild from 'esbuild';
import fs from 'fs';
import http from 'node:http';
import path from 'path';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const options = {
  // Set the port you want the server to listen on.
  port: getOptionIfProvided( 'port', 80 ),
  logLevel: getOptionIfProvided( 'logLevel', 'info' )  // or 'verbose'
};

const VERBOSE = options.logLevel === 'verbose'; // Lots of console.log
const SAVE_TO_DIST = false; // Write files to the disk, for inspection and debugging

// @ts-expect-error
const __dirname = dirname( import.meta.url );

// The esbuild command in our example uses --servedir=..
// so we assume our static files live one directory above this script.
const STATIC_ROOT = path.join( __dirname, '../../../../' );

// A simple mapping from file extension to Content-Type.
function getContentType( filePath: string ): string {
  const ext = path.extname( filePath ).toLowerCase();
  switch( ext ) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
    case '.map':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

// Helper to send responses with proper headers.
function sendResponse( res: http.ServerResponse, statusCode: number, contentType: string, data: any ): void {
  res.statusCode = statusCode;
  res.setHeader( 'Content-Type', contentType );
  res.end( data );
}

// HACK ALERT: for simLauncher, rename 'js' to 'ts' in the file so it will load a Brand
const simLauncherRewrite = {
  name: 'example',
  setup( build: IntentionalAny ) {
    build.onLoad( { filter: /simLauncher.ts$/ }, async ( args: IntentionalAny ) => {
      let text = await fs.promises.readFile( args.path, 'utf8' );
      text = text.replace( '\'js\'', '\'ts\'' );
      return { contents: text, loader: 'ts' };
    } );
  }
};

// HACK ALERT: for himalaya, export to window
const himalayaRewrite = {
  name: 'example',
  setup( build: IntentionalAny ) {
    build.onLoad( { filter: /himalaya-1.1.0.js$/ }, async ( args: IntentionalAny ) => {
      let text = await fs.promises.readFile( args.path, 'utf8' );
      text = text.replace(
        '(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.himalaya = f()}})',
        '( function( f ) {self.himalaya = f();})' );
      return { contents: text, loader: 'js' };
    } );
  }
};
// HACK ALERT: for peggy, export to window
const peggyRewrite = {
  name: 'example',
  setup( build: IntentionalAny ) {
    build.onLoad( { filter: /peggy-3.0.2.js$/ }, async ( args: IntentionalAny ) => {
      let text = await fs.promises.readFile( args.path, 'utf8' );
      text = text.replace(
        'function(e,u){"object"==typeof exports&&"undefined"!=typeof module?module.exports=u():"function"==typeof define&&define.amd?define(u):(e="undefined"!=typeof globalThis?globalThis:e||self).peggy=u()}',
        '( function( e,u ) {self.peggy = u();})' );
      return { contents: text, loader: 'js' };
    } );
  }
};

function saveToDist( pathname: string, contents: string ): void {
  const fullPath = path.join( STATIC_ROOT, 'chipper/dist/dev-server/', pathname );
  fs.mkdirSync( path.parse( fullPath ).dir, { recursive: true } );
  fs.writeFileSync( fullPath, contents );
}

// Bundles a TS (or JS) file using esbuild.
function bundleTS( filePath: string, res: http.ServerResponse, pathname: string ): void {

  // print without newline
  process.stdout.write( `Bundling ${filePath}: ` );

  const start = Date.now();
  esbuild.build( {
    entryPoints: [ filePath ],
    bundle: true,
    format: 'esm',
    write: false,
    sourcemap: 'inline',
    plugins: [
      simLauncherRewrite,
      himalayaRewrite,
      peggyRewrite
    ]
  } )
    .then( result => {
      const code = result.outputFiles[ 0 ].contents;
      SAVE_TO_DIST && saveToDist( pathname, result.outputFiles[ 0 ].text );
      console.log( `${Date.now() - start}ms` );
      res.statusCode = 200;
      res.setHeader( 'Content-Type', 'application/javascript' );
      res.setHeader( 'Cache-Control', 'no-store' );
      res.end( code );
    } )
    .catch( err => {
      console.error( 'Esbuild bundling error:', err );
      sendResponse( res, 500, 'text/plain', 'Build failed:\n' + err.message );
    } );
}

// Transpiles a TS file in-memory.
function transpileTS( tsCode: string, filePath: string, res: http.ServerResponse, pathname: string ): void {
  VERBOSE && console.log( `Transpiling TS file: ${filePath}` );
  esbuild.transform( tsCode, {
    loader: 'ts',
    target: 'esnext'
  } )
    .then( result => {
      VERBOSE && console.log( 'Transpilation successful' );
      SAVE_TO_DIST && saveToDist( pathname, result.code );
      res.statusCode = 200;
      res.setHeader( 'Content-Type', 'application/javascript' );
      res.setHeader( 'Cache-Control', 'no-store' );
      res.end( result.code );
    } )
    .catch( err => {
      console.error( 'Esbuild transform error:', err );
      sendResponse( res, 500, 'text/plain', 'Build failed:\n' + err.message );
    } );
}

function rewritePathname( pathname: string ): string {

  // If the request is for a directory, serve index.html.
  if ( pathname.endsWith( '/' ) ) {
    pathname += 'index.html';
  }
  else if ( !pathname.includes( '.' ) ) {
    try {
      if ( fs.lstatSync( path.join( STATIC_ROOT, pathname ) ).isDirectory() ) {
        pathname += '/index.html';
      }
    }
    catch( e ) {
      // doesn't exist as is, probably not a directory!
    }
  }

  // pathname = pathname.replace( /\/2,}/g, '/' );

  // Requests for /chipper/dist/js/ are rerouted to the source *.ts or *.js file
  const match = '/chipper/dist/js/';
  if ( pathname.startsWith( match ) ) {
    return pathname.replace( match, '' );
  }

  if ( pathname.includes( match ) ) {
    const relativePath = pathname.split( match )[ 1 ];
    const newPathname = `/alternative/js/${relativePath}`;
    VERBOSE && console.log( `Rewriting ${pathname} to ${newPathname}` );
    return newPathname;
  }
  return pathname;
}


const server = http.createServer( ( req, res ) => {
  res.setHeader( 'Connection', 'close' );
  let url = req.url!;

  // This can not be done with the pathname, it must be done before the URL() construction
  if ( url.startsWith( '//' ) ) {
    url = url.slice( 1 );
  }
  const parsedUrl = new URL( url, `http://${req.headers.host}` );
  let pathname = parsedUrl.pathname;

  VERBOSE && console.log( 'Request:', pathname );

  // Check if we need to rewrite the path:
  pathname = rewritePathname( pathname );

  const filePath = path.join( STATIC_ROOT, pathname );
  const ext = path.extname( filePath ).toLowerCase();

  // --- Handle TypeScript requests ---
  if ( ext === '.ts' ) {
    VERBOSE && console.log( 'TS file request detected:', filePath );
    fs.readFile( filePath, ( err, tsData ) => {
      if ( err ) {
        console.error( 'TS file not found:', filePath );
        sendResponse( res, 404, 'text/plain', 'File not found.' );
        return;
      }
      if ( filePath.endsWith( '-main.ts' ) || filePath.endsWith( '-tests.ts' ) ) {
        bundleTS( filePath, res, pathname );
      }
      else {
        transpileTS( tsData.toString(), filePath, res, pathname );
      }
    } );
    return;
  }

  // --- Handle JavaScript requests ---
  if ( ext === '.js' ) {

    // Bundle *.js entry points (e.g., -main.js or -tests.js) using bundleTS.
    if ( filePath.endsWith( '-main.js' ) || filePath.endsWith( '-tests.js' ) ) {
      VERBOSE && console.log( 'JS entry point detected, bundling:', filePath );
      bundleTS( filePath, res, pathname );
      return;
    }

    // First try to serve the static .js file.
    fs.readFile( filePath, ( err, data ) => {
      if ( !err ) {
        VERBOSE && console.log( 'Serving static JS file:', filePath );
        sendResponse( res, 200, getContentType( filePath ), data );
      }
      else {
        let found = false;
        VERBOSE && console.log( 'Static JS file not found file:', filePath );
        const nonJSExtensions = [ 'ts', 'jsx', 'tsx', 'mts' ];

        // If the static .js file is not found, look for a corresponding .ts file.
        for ( let i = 0; i < nonJSExtensions.length; i++ ) {
          const ext = nonJSExtensions[ i ];

          const extFilePath = filePath.slice( 0, -ext.length - 1 ) + `.${ext}`;

          let contents: string;
          try {
            contents = fs.readFileSync( extFilePath, 'utf-8' );
          }
          catch( e ) {
            VERBOSE && console.log( 'Static JS file not found, but found file with ext:', extFilePath );

            // try another file extension
            continue;
          }
          if ( extFilePath.endsWith( `-main.${ext}` ) || extFilePath.endsWith( `-tests.${ext}` ) ) {
            found = true;
            bundleTS( extFilePath, res, pathname );
          }
          else {
            found = true;
            transpileTS( contents, extFilePath, res, pathname );
          }
          // Found it
          break;
        }

        !found && sendResponse( res, 404, 'text/plain', 'File not found.' );
      }
    } );
    return;
  }

  // --- For any other file types, serve it as a static file ---
  fs.readFile( filePath, ( err, data ) => {
    if ( err ) {
      VERBOSE && console.error( 'Static file not found:', filePath );
      sendResponse( res, 404, 'text/plain', 'File not found.' );
      return;
    }
    VERBOSE && console.log( 'Serving static file:', filePath );
    sendResponse( res, 200, getContentType( filePath ), data );
  } );
} );

server.listen( options.port, () => {
  console.log( `Serving phetsims repo root at http://localhost:${options.port}/` );
} );