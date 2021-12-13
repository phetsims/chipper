// Copyright 2021, University of Colorado Boulder

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
 *                        are modified externally, for example if you deleted/modified a transpiled file in chipper/dist.
 * --skipInitial          Skip the initial transpilation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// constants
const start = Date.now();
const args = process.argv.slice( 2 );

// imports
const Transpiler = require( '../common/Transpiler' );

const transpiler = new Transpiler( {
  clean: args.includes( '--clean' ),
  verbose: args.includes( '--verbose' )
} );

// Initial pass
if ( !args.includes( '--skipInitial' ) ) {
  transpiler.transpileAll();
  console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );
}

// Watch process
if ( args.includes( '--watch' ) ) {
  transpiler.watch();
  console.log( 'Watching...' );
}