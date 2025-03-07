// Copyright 2025, University of Colorado Boulder

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Serve for phetsims development:
 *
 * 1. static server
 * 2. If the request is for a *.ts file, then transpile it to a *.js file and return it.
 *    a. If the request is for a *-main.ts file, then bundle it with esbuild and return it.
 *    b. If the request is for a *.ts file that is not a *-main.ts file, then transpile it in-memory (single file) and return it.
 * 3. If the request is found on the filesystem, return it.
 * 4. Add sufficient console.log statements to help debug.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import esbuild from 'esbuild';
import fs from 'fs';
import http from 'node:http';
import path from 'path';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';

const options = {
  // Set the port you want the server to listen on.
  port: getOptionIfProvided( 'port' ) || 80
};

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

// Bundles a TS file using esbuild.
function bundleTS( filePath: string, res: http.ServerResponse, extraOptions: Record<string, any> = {} ): void {
  console.log( `Bundling main TS file: ${filePath}` );
  const defaultOptions = {
    entryPoints: [ filePath ],
    bundle: true,
    format: 'esm',
    write: false
  };
  const buildOptions = Object.assign( {}, defaultOptions, extraOptions );

  // @ts-expect-error
  esbuild.build( buildOptions )
    .then( result => {
      console.log( 'Bundling successful' );
      res.statusCode = 200;
      res.setHeader( 'Content-Type', 'application/javascript' );
      res.setHeader( 'Cache-Control', 'no-store' );
      res.end( result.outputFiles![ 0 ].contents );
    } )
    .catch( err => {
      console.error( 'Esbuild bundling error:', err );
      sendResponse( res, 500, 'text/plain', 'Build failed:\n' + err.message );
    } );
}

// Transpiles a TS file in-memory.
function transpileTS( tsCode: string, filePath: string, res: http.ServerResponse ): void {
  console.log( `Transpiling TS file: ${filePath}` );
  esbuild.transform( tsCode, {
    loader: 'ts',
    target: 'esnext'
  } )
    .then( result => {
      console.log( 'Transpilation successful' );
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

const server = http.createServer( ( req, res ) => {
  res.setHeader( 'Connection', 'close' );
  const parsedUrl = new URL( req.url!, `http://${req.headers.host}` );
  let pathname = parsedUrl.pathname;

  console.log( 'Request:', pathname );

  // Warn if the URL contains chipper/dist.
  if ( pathname.includes( 'chipper/dist' ) ) {
    console.log( 'WARNING: found chipper dist' );
  }

  // If the request is for a directory, serve index.html.
  if ( pathname.endsWith( '/' ) ) {
    pathname += 'index.html';
  }

  const filePath = path.join( STATIC_ROOT, pathname );
  const ext = path.extname( filePath ).toLowerCase();

  // --- Handle TypeScript requests ---
  if ( ext === '.ts' ) {
    console.log( 'TS file request detected:', filePath );
    fs.readFile( filePath, ( err, tsData ) => {
      if ( err ) {
        console.error( 'TS file not found:', filePath );
        sendResponse( res, 404, 'text/plain', 'File not found.' );
        return;
      }
      if ( filePath.endsWith( '-main.ts' ) ) {
        bundleTS( filePath, res, { sourcemap: 'inline' } );
      }
      else {
        transpileTS( tsData.toString(), filePath, res );
      }
    } );
    return;
  }

  // --- Handle JavaScript requests ---
  if ( ext === '.js' ) {
    // First try to serve the static .js file.
    fs.readFile( filePath, ( err, data ) => {
      if ( !err ) {
        console.log( 'Serving static JS file:', filePath );
        sendResponse( res, 200, getContentType( filePath ), data );
      }
      else {
        // If the static .js file is not found, look for a corresponding .ts file.
        const tsFilePath = filePath.slice( 0, -3 ) + '.ts';
        console.log( 'Static JS file not found, trying TS file:', tsFilePath );
        fs.readFile( tsFilePath, ( err2, tsData ) => {
          if ( err2 ) {
            console.error( 'TS file for JS request not found:', tsFilePath );
            sendResponse( res, 404, 'text/plain', 'File not found.' );
            return;
          }
          if ( tsFilePath.endsWith( '-main.ts' ) ) {
            bundleTS( tsFilePath, res, { globalName: 'MembraneChannelsBundle' } );
          }
          else {
            transpileTS( tsData.toString(), tsFilePath, res );
          }
        } );
      }
    } );
    return;
  }

  // --- For any other file types, serve it as a static file ---
  fs.readFile( filePath, ( err, data ) => {
    if ( err ) {
      console.error( 'Static file not found:', filePath );
      sendResponse( res, 404, 'text/plain', 'File not found.' );
      return;
    }
    console.log( 'Serving static file:', filePath );
    sendResponse( res, 200, getContentType( filePath ), data );
  } );
} );

server.listen( options.port, () => {
  console.log( `Server running at http://localhost:${options.port}/` );
} );