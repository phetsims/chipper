// Copyright 2020-2024, University of Colorado Boulder

/**
 * Prints out a JSON map from repo name => list of all dependencies (used by e.g. phettest), for a comma-separated list of repos.
 * Babel is excluded (should be included as a dependency on everything).
 *
 * This is done for efficiency (so we don't need to launch multiple scripts)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import assert from 'assert';
import getPhetLibs from '../grunt/getPhetLibs.js';

assert( typeof process.argv[ 2 ] === 'string', 'Provide the repo name as the first parameter' );
const repos = process.argv[ 2 ].split( ',' );

const result: Record<string, string[]> = {};
for ( const repo of repos ) {
  result[ repo ] = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ).sort();
}

console.log( JSON.stringify( result, null, 2 ) );