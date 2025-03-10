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
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

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


// HACK ALERT: for simLauncher, rename 'js' to 'ts' in the file so it will load a Brand
const exampleOnLoadPlugin = {
  name: 'example',
  setup( build: IntentionalAny ) {
    // Load ".txt" files and return an array of words
    build.onLoad( { filter: /simLauncher.ts$/ }, async ( args: IntentionalAny ) => {
      let text = await fs.promises.readFile( args.path, 'utf8' );

      text = text.replace( '\'js\'', '\'ts\'' );
      return {
        contents: text,
        loader: 'ts'
      };
    } );
  }
};

// Bundles a TS file using esbuild.
function bundleTS( filePath: string, res: http.ServerResponse ): void {
  console.log( `Bundling main TS file: ${filePath}` );

  esbuild.build( {
    entryPoints: [ filePath ],
    bundle: true,
    format: 'esm',
    write: false,
    sourcemap: 'inline',
    plugins: [ exampleOnLoadPlugin ]
  } )
    .then( result => {
      console.log( 'Bundling successful' );
      res.statusCode = 200;
      res.setHeader( 'Content-Type', 'application/javascript' );
      res.setHeader( 'Cache-Control', 'no-store' );
      res.end( result.outputFiles[ 0 ].contents );
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

// HACK ALERT. Requests for /chipper/dist/js/ are rerouted to the source *.ts or *.js file
function rewritePathname( pathname: string ): string {
  const match = '/chipper/dist/js/';

  if ( pathname.startsWith( match ) ) {
    return pathname.replace( match, '' );
  }

  if ( pathname.includes( match ) ) {
    const relativePath = pathname.split( match )[ 1 ];
    const newPathname = `/alternative/js/${relativePath}`;
    console.log( `Rewriting ${pathname} to ${newPathname}` );
    return newPathname;
  }
  return pathname;
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

  // Check if we need to rewrite the path:
  pathname = rewritePathname( pathname );

  // HACK ALERT peggy and himalaya are somehow forgotten in this serve, so we have to add them.
  const serveBonus = ( bonusFile: string ) => {
    const fileSaverPath = path.join( STATIC_ROOT, pathname );

    const himalayaPath = path.join( STATIC_ROOT, bonusFile );

    console.log( 'Concatenating FileSaver and Himalaya JS files.' );

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

  if ( pathname === '/sherpa/lib/FileSaver-b8054a2.js' ) {
    serveBonus( '/sherpa/lib/himalaya-1.1.0.js' );
    return;
  }

  // TODO: Or adjust HTML contents to add it? https://github.com/phetsims/chipper/issues/1559
  if ( pathname === '/sherpa/lib/react-18.1.0.production.min.js' ) {
    serveBonus( '/sherpa/lib/peggy-3.0.2.js' );
    return;
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
      if ( filePath.endsWith( '-main.ts' ) || filePath.endsWith( '-tests.ts' ) ) {
        bundleTS( filePath, res );
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
        // console.log( 'Serving static JS file:', filePath );
        sendResponse( res, 200, getContentType( filePath ), data );
      }
      else {
        // If the static .js file is not found, look for a corresponding .ts file.
        const tsFilePath = filePath.slice( 0, -3 ) + '.ts';
        // console.log( 'Static JS file not found, trying TS file:', tsFilePath );
        fs.readFile( tsFilePath, ( err2, tsData ) => {
          if ( err2 ) {
            // console.error( 'TS file for JS request not found:', tsFilePath );
            sendResponse( res, 404, 'text/plain', 'File not found.' );
            return;
          }
          if ( tsFilePath.endsWith( '-main.ts' ) || tsFilePath.endsWith( '-tests.ts' ) ) {
            bundleTS( tsFilePath, res );
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