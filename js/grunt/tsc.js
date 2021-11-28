// Copyright 2021, University of Colorado Boulder

/**
 * Runs `tsc --build` before the webpack step, so webpack can use the transpiled outputs (in chipper/dist)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
const execute = require( '../../../perennial-alias/js/common/execute' );

// const Transpiler = require( '../common/Transpiler' );

/**
 * @param {string} path - path to tsconfig file or directory containing tsconfig file
 * @param {Array.<string>} commandLineArgs
 * @returns {Promise<{execResult: {stdout:string,stderr:string,code:number}, time: number}>} - the results from exec, and the elapsed time
 */
const tsc = async function( path, commandLineArgs ) {

  // create a new one so it refreshes activeRepos right before transpilation
  // new Transpiler().transpileAll();

  const args = [ '../chipper/node_modules/typescript/bin/tsc', ...commandLineArgs ];
  return execute( 'node', args, path, {
    errors: 'resolve'
  } );
};

// so that hook-pre-commit.js knows if it loaded a compatible version
tsc.apiVersion = '1.0';
/**
 * @public
 *
 * @param {string} repo
 * @param {string[]} commandLineArgs
 */
module.exports = tsc;