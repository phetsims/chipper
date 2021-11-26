// Copyright 2021, University of Colorado Boulder

/**
 * Transpiles all *.ts and copies all *.js files to chipper/dist. Does not do type checking.
 *
 * Usage:
 * cd chipper
 * node transpile/transpile-all.js --watch
 *
 * OPTIONS:
 * --watch                continue watching all directories and transpile on detected changes
 * --ignoreInitial false  (default) transpile all files on startup
 * --ignoreInitial true   skip initial transpile on startup
 * --clean                dispose of the cache that tracks file status on startup, can be combined with other commands
 *                        you would need to run --clean if the transpiled file status ever gets out of sync with the
 *                        cache file status, for example if you deleted/modified a transpiled file
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const start = Date.now();
const chokidar = require( 'chokidar' );
const transpileFunction = require( './transpileFunction' );
const fs = require( 'fs' );
const crypto = require( 'crypto' );
const path = require( 'path' );

const statusPath = '../chipper/transpile/cache/status.json';
const args = process.argv.slice( 2 );

// Track the status of each repo
let status = {};

// Make sure a directory exists for the cached status file
fs.mkdirSync( path.dirname( statusPath ), { recursive: true } );

// Clear the cache on `--clean`
if ( args.includes( '--clean' ) ) {
  fs.writeFileSync( statusPath, JSON.stringify( {}, null, 2 ) );
}

// Load cached status
try {
  status = JSON.parse( fs.readFileSync( statusPath, 'utf-8' ) );
}
catch( e ) {
  status = {};
  fs.writeFileSync( statusPath, JSON.stringify( status, null, 2 ) );
}

const index = args.indexOf( '--ignoreInitial' );
let ignoreInitial = false;
if ( index >= 0 ) {
  if ( args[ index + 1 ] === 'true' ) {
    ignoreInitial = true;
  }
  else if ( args[ index + 1 ] === 'false' ) {
    ignoreInitial = false;
  }
  else {
    throw new Error( 'illegal value for ignoreInitial' );
  }
}

const activeRepos = fs.readFileSync( '../perennial/data/active-repos', 'utf-8' ).trim().split( '\n' );
const paths = [];
activeRepos.forEach( repo => {
  paths.push( `../${repo}/js` );
  paths.push( `../${repo}/images` );
  paths.push( `../${repo}/sounds` );
} );

chokidar.watch( paths, {
  ignoreInitial: ignoreInitial,
  ignored: [ '**/chipper/dist/**/' ]
} ).on( 'all', ( event, path ) => {
  if ( path.endsWith( '.js' ) || path.endsWith( '.ts' ) ) {
    const changeDetectedTime = Date.now();
    const text = fs.readFileSync( path, 'utf-8' );
    const hash = crypto.createHash( 'md5' ).update( text ).digest( 'hex' );

    if ( !status[ path ] || status[ path ].md5 !== hash ) {
      status[ path ] = { md5: hash };
      transpileFunction( path, text );
      fs.writeFileSync( statusPath, JSON.stringify( status, null, 2 ) );
      const t = Date.now();
      const elapsed = t - changeDetectedTime;
      console.log( elapsed + 'ms: ' + path );
    }
  }
} ).on( 'ready', () => {
  if ( !args.includes( '--watch' ) ) {
    console.log( 'Finished transpilation in ' + ( Date.now() - start ) + 'ms' );
    process.exit( 0 );
  }
  else {
    console.log( 'Finished initial scan in ' + ( Date.now() - start ) + 'ms' );
    console.log( 'Watching...' );
  }
} );