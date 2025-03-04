// Copyright 2025, University of Colorado Boulder

/**
 * TODO: https://github.com/phetsims/chipper/issues/1559
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import esbuild from 'esbuild';
import fs from 'fs';
import http from 'node:http';
import path from 'path';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import pascalCase from '../../common/pascalCase.js';


const options = {

  // Set the port you want the server to listen on.
  port: getOptionIfProvided( 'port' ) || 8080
};

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

// The esbuild command in our example uses --servedir=..
// so we assume our static files live one directory above this script.
const STATIC_ROOT = path.join( __dirname, '../../../../' );
const BUNDLE_FILE_NAME = 'phetBundle.js';

// A very basic mapping from file extension to Content-Type.
// TODO: Can we do better here? See withServer, https://github.com/phetsims/chipper/issues/1559
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
      return 'application/json';
    case '.map':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

const server = http.createServer( ( req, res ) => {
  res.setHeader( 'Connection', 'close' );  // TODO: Is this helpful? https://github.com/phetsims/chipper/issues/1559


  const parsedUrl = new URL( req.url!, 'http://' + req.headers.host );
  let pathname = parsedUrl.pathname;

  // If the request is for the root path, serve index.html.
  if ( pathname.endsWith( '/' ) ) {
    pathname += 'index.html';
  }

  // If the requested file is the BUNDLE_FILE_NAME, trigger the esbuild process.
  // Note that fluent has a file called "bundle.js"
  if ( pathname.endsWith( BUNDLE_FILE_NAME ) ) {
    console.log( `Received request for ${pathname}. Triggering esbuild...` );

    const repo = parsedUrl.searchParams.get( 'repo' );

    if ( !repo ) {
      res.statusCode = 400;
      res.setHeader( 'Content-Type', 'text/plain' );
      const message = 'Expected a repo when requesting ' + BUNDLE_FILE_NAME + ', `?repo=REPO`';
      res.end( message );
      console.error( message, parsedUrl );
      return;
    }
    console.log( 'repo = ', repo );

    // Define the esbuild arguments based on your exemplar.
    // Note that we remove the --watch, --servedir, and --serve flags
    // because we're doing an on-demand build.
    // Check if the .ts file exists, otherwise use .js
    const tsPath = `${repo}/js/${repo}-main.ts`;
    const jsPath = `${repo}/js/${repo}-main.js`;
    const entryFile = fs.existsSync( path.join( STATIC_ROOT, tsPath ) ) ? tsPath : jsPath;
    const outFile = path.join( STATIC_ROOT, 'chipper', 'dist', 'bundles', BUNDLE_FILE_NAME );
    const bundleName = `${pascalCase( repo )}Bundle`;

    const start = Date.now();
    esbuild.build( {
      entryPoints: [ path.join( STATIC_ROOT, entryFile ) ],
      bundle: true,
      format: 'iife',
      globalName: bundleName,
      outfile: outFile,
      sourcemap: true
    } ).then( () => {
      console.log( `Esbuild completed in ${Date.now() - start}ms.` );
      console.log( `Esbuild completed successfully. Serving ${BUNDLE_FILE_NAME}` );

      // Now read the freshly built bundle and serve it
      fs.readFile( outFile, ( err, data ) => {
        if ( err ) {
          console.error( `Error reading ${BUNDLE_FILE_NAME}:`, err );
          res.statusCode = 500;
          res.setHeader( 'Content-Type', 'text/plain' );
          res.end( 'Error reading bundle file.' );
          return;
        }
        // Serve the file with no caching
        res.statusCode = 200;
        res.setHeader( 'Content-Type', 'application/javascript' );
        res.setHeader( 'Cache-Control', 'no-store' );
        res.end( data );
      } );
    } )
      .catch( err => {
        console.error( 'Esbuild error:', err );
        res.statusCode = 500;
        res.setHeader( 'Content-Type', 'text/plain' );
        res.end( 'Build failed:\n' + err.message );
      } );

  }
  else {
    // For all other requests, serve static files from STATIC_ROOT.
    const filePath = path.join( STATIC_ROOT, pathname );
    fs.readFile( filePath, ( err, data ) => {
      if ( err ) {
        console.error( `File not found: ${filePath}` );
        res.statusCode = 404;
        res.setHeader( 'Content-Type', 'text/plain' );
        res.end( 'File not found.' );
      }
      else {
        res.statusCode = 200;
        res.setHeader( 'Content-Type', getContentType( filePath ) );
        res.end( data );
      }
    } );
  }
} );

server.listen( options.port, () => {
  console.log( `Server running at http://localhost:${options.port}/` );
} );