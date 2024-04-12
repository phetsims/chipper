// Copyright 2021-2024, University of Colorado Boulder

/**
 * Command Line Interface (CLI) for TypeScript transpilation via babel.  Transpiles *.ts and copies all *.js files to
 * chipper/dist/js. Does not do type checking. Filters based on active-repos and subsets of directories within repos
 * (such as js/, images/, and sounds/)
 *
 * Usage:
 * cd chipper
 * node js/scripts/transpile.js --watch
 *
 * OPTIONS:
 * --watch                Continue watching all directories and transpile on detected changes.
 * --clean                Dispose of the cache that tracks file status on startup, can be combined with other commands.
 *                        You would need to run --clean if the files in chipper/dist/js or chipper/dist/js-cache-status.json
 *                        are modified externally.  For example if you edit a file in chipper/dist/js or if you edit
 *                        chipper/dist/js-cache-status.json, they would be out of sync.  If you `rm -rf chipper/dist`
 *                        that does not require --clean, because that erases the cache file and the js files together.
 * --repos                Additional repos to compile (not listed in perennial-alias/data/active-repos). The names of the repos,
 *                        separated by commas, like --repos=myrepo1,myrepo2. Directory names only, not paths
 * --skipMinifyWGSL       Do not minify WGSL files
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// constants
const start = Date.now();
const args = process.argv.slice( 2 );

// imports
const Transpiler = require( '../common/Transpiler' );

const repos = [];

const reposKey = '--repos=';
args.filter( arg => arg.startsWith( reposKey ) ).forEach( arg => {
  repos.push( ...arg.substring( reposKey.length ).split( ',' ) );
} );

const brands = [];

const brandsKey = '--brands=';
args.filter( arg => arg.startsWith( brandsKey ) ).forEach( arg => {
  brands.push( ...arg.substring( brandsKey.length ).split( ',' ) );
} );

const transpiler = new Transpiler( {
  clean: args.includes( '--clean' ),
  verbose: args.includes( '--verbose' ),
  repos: repos,
  brands: brands,
  minifyWGSL: !args.includes( '--skipMinifyWGSL' )
} );

transpiler.pruneStaleDistFiles( 'js' );
transpiler.pruneStaleDistFiles( 'commonjs' );

// Watch process
if ( args.includes( '--watch' ) ) {
  transpiler.watch();
}

// Initial pass
transpiler.transpileAll();
console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );

if ( args.includes( '--watch' ) ) {
  console.log( 'Watching...' );
}