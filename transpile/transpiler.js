// Copyright 2021, University of Colorado Boulder

/**
 * Transpiles *.ts and copies all *.js files to chipper/dist. Does not do type checking. Filters based on active-repos
 * and subsets of directories within repos (such as js/, images/, and sounds/)
 *
 * Usage:
 * cd chipper
 * node transpile/transpile-all.js --watch
 *
 * OPTIONS:
 * --watch                continue watching all directories and transpile on detected changes
 * --clean                dispose of the cache that tracks file status on startup, can be combined with other commands
 *                        you would need to run --clean if the transpiled file status ever gets out of sync with the
 *                        cache file status, for example if you deleted/modified a transpiled file
 * --skipInitial          skip the initial transpilation
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// constants
const start = Date.now();
const statusPath = '../chipper/transpile/cache/status.json';
const args = process.argv.slice( 2 );
const root = '../';

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down seach in the initial transpilation and for filtering relevant files in the watch process
const subdirs = [ 'js', 'images', 'sounds' ];

// imports
const fs = require( 'fs' );
const path = require( 'path' );
const crypto = require( 'crypto' );
const core = require( '@babel/core' );

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

/**
 * Transpile the file using babel, and write it to the corresponding location in chipper/dist
 * @param {string} filename
 * @param {string} text - file text
 */
const transpileFunction = ( filename, text ) => {
  const x = core.transformSync( text, {
    filename: filename,
    presets: [ '@babel/preset-typescript' ],
    sourceMaps: 'inline'
  } );
  const relativePath = path.relative( root, filename );
  const targetPath = path.join( root, 'chipper', 'dist', ...relativePath.split( path.sep ) ).split( '.ts' ).join( '.js' );
  fs.mkdirSync( path.dirname( targetPath ), { recursive: true } );
  fs.writeFileSync( targetPath, x.code );
};

/**
 * For *.ts and *.js files, checks if they have changed file contents since last transpile.  If so, the
 * file is transpiled.
 * @param {string} path
 */
const visitFile = path => {
  if ( path.endsWith( '.js' ) || path.endsWith( '.ts' ) ) {
    const changeDetectedTime = Date.now();
    const text = fs.readFileSync( path, 'utf-8' );
    const hash = crypto.createHash( 'md5' ).update( text ).digest( 'hex' );

    // If the file has changed, transpile and update the cache
    if ( !status[ path ] || status[ path ].md5 !== hash ) {
      transpileFunction( path, text );
      status[ path ] = { md5: hash };
      fs.writeFileSync( statusPath, JSON.stringify( status, null, 2 ) );
      console.log( ( Date.now() - changeDetectedTime ) + 'ms: ' + path );
    }
  }
};

let activeRepos = fs.readFileSync( '../perennial/data/active-repos', 'utf-8' ).trim().split( '\n' );

// Recursively visit a directory for files to transpile
const visitDirectory = ( dir => {
  if ( fs.existsSync( dir ) ) {
    const files = fs.readdirSync( dir );
    files.forEach( file => {
      const child = dir + path.sep + file;
      if ( fs.lstatSync( child ).isDirectory() ) {
        visitDirectory( child );
      }
      else {
        visitFile( child );
      }
    } );
  }
} );

// Visit all the subdirectories in a repo that need transpilation
const visitRepo = repo => subdirs.forEach( subdir => visitDirectory( `../${repo}/${subdir}` ) );

// Initial pass
if ( !args.includes( '--skipInitial' ) ) {
  activeRepos.forEach( repo => visitRepo( repo ) );
  console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );
}

// Watch process
if ( args.includes( '--watch' ) ) {
  fs.watch( '../', { recursive: true }, ( eventType, filename ) => {

    if ( filename.includes( '/node_modules/' ) ||
         filename.includes( '.git/' ) ||
         filename.includes( 'chipper/dist/' ) ||
         filename.includes( 'transpile/cache/status.json' ) ||

         // Temporary files sometimes saved by the IDE
         filename.endsWith( '~' ) ) {

      // ignore
    }
    else if ( filename === 'perennial/data/active-repos' ) {
      const newActiveRepos = fs.readFileSync( '../perennial/data/active-repos', 'utf-8' ).trim().split( '\n' );
      console.log( 'reloaded active repos' );
      const newRepos = newActiveRepos.filter( repo => !activeRepos.includes( repo ) );

      //Scan anything that was added
      newRepos.forEach( repo => {
        console.log( 'New repo detected in active-repos, transpiling: ' + repo );
        visitRepo( repo );
      } );
      activeRepos = newActiveRepos;
    }
    else {
      args.includes( '--verbose' ) && console.log( eventType, filename );
      const terms = filename.split( path.sep );
      if ( activeRepos.includes( terms[ 0 ] ) && subdirs.includes( terms[ 1 ] ) ) {
        visitFile( '../' + filename );
      }
    }
  } );
  console.log( 'Watching...' );
}