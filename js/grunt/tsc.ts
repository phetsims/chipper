// Copyright 2021-2022, University of Colorado Boulder

/**
 * Runs `tsc`. If you run into a memory error, consider setting the environment variable like so:
 * export NODE_OPTIONS=--max_old_space_size=4096
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
const execute = require( '../../../perennial-alias/js/common/execute' );

/**
 * @param path - path to tsconfig file or directory containing tsconfig file
 * @param commandLineArgs
 * @returns - the results from exec, and the elapsed time
 */
const tsc = async function( path: string, commandLineArgs: string[] = [] ): Promise<{ execResult: { stdout: string; stderr: string; code: number }; time: number }> {

  const args = [ '../chipper/node_modules/typescript/bin/tsc', ...commandLineArgs ];
  return execute( 'node', args, path, {
    errors: 'resolve'
  } );
};

// so that hook-pre-commit.js knows if it loaded a compatible version
tsc.apiVersion = '1.0';

module.exports = tsc;