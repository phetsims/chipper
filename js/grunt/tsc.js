// Copyright 2021, University of Colorado Boulder

/**
 * Runs `tsc --build` before the webpack step, so webpack can use the transpiled outputs (in chipper/dist)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
const execute = require( '../../../perennial-alias/js/dual/execute' );
const assert = require( 'assert' );

// constants
const EXPECTED_VERSION = 'Version 4.4.2';

/**
 * @param repo
 * @param commandLineArgs
 * @returns {Promise<{execResult: {stdout:string,stderr:string,code:number}, time: number}>} - the results from exec, and the elapsed time
 */
const tsc = async function( repo, commandLineArgs ) {
  const startTime = Date.now();

  // TODO: Or could use compiler API: https://github.com/Microsoft/TypeScript/issues/6387 https://github.com/phetsims/tasks/issues/987
  // See also: https://stackoverflow.com/a/56073979

  // make sure we are using the right version of the tsc compiler, so we guarantee reproducible output
  const versionResult = await execute( 'node', [ '../chipper/node_modules/typescript/bin/tsc', '--version' ], `../${repo}`, {
    errors: 'resolve'
  } );
  const version = versionResult.stdout.trim();
  assert && assert( versionResult.code === 0 && version === EXPECTED_VERSION, `Incompatible tsc version: ${version}, expected ${EXPECTED_VERSION}` );

  const args = [ '../chipper/node_modules/typescript/bin/tsc', ...commandLineArgs ];
  const execResult = ( await execute( 'node', args, `../${repo}`, {
    errors: 'resolve'
  } ) );
  const endTime = Date.now();
  const elapsedTime = endTime - startTime;
  return { execResult: execResult, time: elapsedTime };
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