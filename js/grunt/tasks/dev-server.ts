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
      text = text.replace( '(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.himalaya = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module \'"+o+"\'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){',
        `( function( f ) {
  if ( false ) {module.exports = f()}
  else if ( false ) {define( [], f )}
  else {
    // var g;
    // if ( typeof window !== 'undefined' ) {g = window}
    // else if ( typeof global !== 'undefined' ) {g = global}
    // else if ( typeof self !== 'undefined' ) {g = self}
    // else {g = this}
    window.himalaya = f()
  }
} )( function() {
  var define, module, exports;
  return ( function() {
    function e( t, n, r ) {
      function s( o, u ) {
        if ( !n[ o ] ) {
          if ( !t[ o ] ) {
            var a = typeof require == 'function' && require;
            if ( !u && a ) {
              return a( o, !0 );
            }
            if ( i ) {
              return i( o, !0 );
            }
            var f = new Error( 'Cannot find module \\'' + o + '\\'' );
            throw f.code = 'MODULE_NOT_FOUND', f
          }
          var l = n[ o ] = { exports: {} };
          t[ o ][ 0 ].call( l.exports, function( e ) {
            var n = t[ o ][ 1 ][ e ];
            return s( n ? n : e )
          }, l, l.exports, e, t, n, r )
        }
        return n[ o ].exports
      }

      var i = typeof require == 'function' && require;
      for ( var o = 0; o < r.length; o++ ) {
        s( r[ o ] );
      }
      return s
    }

    return e
  } )()( {
    1: [ function( require, module, exports ) {` );
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
    sourcemap: 'inline', // TODO: Are sourcemaps: false in the browser the same as the exact source code? https://github.com/phetsims/chipper/issues/1559
    plugins: [
      simLauncherRewrite,
      himalayaRewrite
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
  // TODO: support directories mapping to index.html https://github.com/phetsims/chipper/issues/1559
  if ( pathname.endsWith( '/' ) ) {
    pathname += 'index.html';
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

  // TODO: URL.pathname does not support a request like `//phet-io-sim-specific/repos/buoyancy/buoyancy-phet-io-api.json` https://github.com/phetsims/chipper/issues/1559
  const parsedUrl = new URL( req.url!, `http://${req.headers.host}` );
  let pathname = parsedUrl.pathname;

  VERBOSE && console.log( 'Request:', pathname );

  // Check if we need to rewrite the path:
  pathname = rewritePathname( pathname );

  const serveBonus = ( bonusFile: string ) => {
    const fileSaverPath = path.join( STATIC_ROOT, pathname );

    const himalayaPath = path.join( STATIC_ROOT, bonusFile );

    VERBOSE && console.log( 'Concatenating FileSaver and Himalaya JS files.' );

    fs.readFile( fileSaverPath, ( err, fileSaverData ) => {
      if ( err ) {
        console.error( 'FileSaver file not found:', fileSaverPath );
        sendResponse( res, 404, 'text/plain', 'FileSaver file not found.' );
        return;
      }

      fs.readFile( himalayaPath, ( err2, himalayaData ) => {
        if ( err2 ) {
          console.error( 'Himalaya file not found:', himalayaPath );
          sendResponse( res, 404, 'text/plain', 'Himalaya file not found.' );
          return;
        }

        // Concatenate both files' contents
        const concatenatedData = Buffer.concat( [ fileSaverData, himalayaData ] );
        sendResponse( res, 200, 'application/javascript', concatenatedData );
      } );
    } );
  };

  // TODO: See if peggy and pako are failing due to the UMD problem like himalaya had, see https://github.com/phetsims/chipper/issues/1559
  if ( pathname === '/sherpa/lib/react-18.1.0.production.min.js' ) {
    serveBonus( '/sherpa/lib/peggy-3.0.2.js' );
    return;
  }

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
        // If the static .js file is not found, look for a corresponding .ts file.
        const tsFilePath = filePath.slice( 0, -3 ) + '.ts';
        VERBOSE && console.log( 'Static JS file not found, trying TS file:', tsFilePath );
        fs.readFile( tsFilePath, ( err2, tsData ) => {
          if ( err2 ) {
            // console.error( 'TS file for JS request not found:', tsFilePath );
            sendResponse( res, 404, 'text/plain', 'File not found.' );
            return;
          }
          if ( tsFilePath.endsWith( '-main.ts' ) || tsFilePath.endsWith( '-tests.ts' ) ) {
            bundleTS( tsFilePath, res, pathname );
          }
          else {
            transpileTS( tsData.toString(), tsFilePath, res, pathname );
          }
        } );
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
  console.log( `Server running at http://localhost:${options.port}/` );
} );