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

const tsc = async function( repo, commandLineArgs ) {
  const startTime = Date.now();

  // TODO: Or could use compiler API: https://github.com/Microsoft/TypeScript/issues/6387 https://github.com/phetsims/tasks/issues/987

  // https://stackoverflow.com/a/56073979
  try {

    // make sure we are using the right version of the tsc compiler, so we guarantee reproducible output
    const version = ( await execute( 'node', [ '../chipper/node_modules/typescript/bin/tsc', '--version' ], `../${repo}` ) ).trim();
    assert && assert( version === EXPECTED_VERSION, `Incompatible tsc version: ${version}, expected ${EXPECTED_VERSION}` );
    let stdout;
    try {

      const args = [ '../chipper/node_modules/typescript/bin/tsc', ...commandLineArgs ];
      stdout = ( await execute( 'node', args, `../${repo}` ) ).trim();
    }
    catch( e ) {
      console.log( `tsc completed with stdout:\n${e.stderr}` );
      console.log( `tsc completed with stderr:\n${e.stdout}` );

      return {
        stderr: e.stderr,
        stdout: e.stdout
      };
    }
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    if ( stdout.length === 0 ) {
      console.log( `tsc completed in ${elapsedTime} ms` );
      return {
        stderr: '',
        stdout: ''
      };
    }
    else {
      console.log( `tsc completed with stdout: ${stdout}` );

      return { stderr: '', stdout: stdout };
    }
  }
  catch( e ) {

    // TODO: useless throw, see https://github.com/phetsims/tasks/issues/987
    console.log( e );
    throw e;
  }
};

tsc.apiVersion = '1.0';
/**
 * @public
 *
 * @param {string} repo
 * @param {string[]} commandLineArgs
 */
module.exports = tsc;