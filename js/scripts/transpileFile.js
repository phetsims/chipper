// Copyright 2021, University of Colorado Boulder

const start = Date.now();
/**
 * Command Line Interface (CLI) for transpiling a single file.
 *
 * usage:
 * cd chipper
 * node js/scripts/transpileFile.js path/to/file.ts
 *
 * This does not check for caching, or up-to-date status, it just transpiles the file.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// constants
const args = process.argv.slice( 2 );

// imports
const Transpiler = require( '../common/Transpiler' );
const fs = require( 'fs' );

const path = args[ 0 ];
const text = fs.readFileSync( path, 'utf-8' );
const targetPath = Transpiler.getTargetPath( args[ 0 ] );

Transpiler.transpileFunction( path, targetPath, text );
console.log( ( Date.now() - start ) + 'ms: ' + path );