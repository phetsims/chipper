// Copyright 2021, University of Colorado Boulder

/**
 * Runs `tsc --build` before the webpack step, so webpack can use the transpiled outputs (in chipper/dist)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
const execute = require( './execute' );
const assert = require( 'assert' );

const tsc = async function( repo, commandLineArgs ) {
  const startTime = Date.now();

  // make sure we are using the right version of the tsc compiler, so we all get the same output
  // TODO: Or could use compiler API: https://github.com/Microsoft/TypeScript/issues/6387 https://github.com/phetsims/tasks/issues/987

  // https://stackoverflow.com/a/56073979
  try {
    const version = ( await execute( 'node', [ '../chipper/node_modules/typescript/bin/tsc', '--version' ], `../${repo}` ) ).trim();
    assert && assert( version === 'Version 4.3.4', `Incompatible tsc version: ${version}, expected Version 4.3.4` );
    let stdout;
    try {
      stdout = ( await execute( 'node', [ '../chipper/node_modules/typescript/bin/tsc', ...commandLineArgs ], `../${repo}` ) ).trim();
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
