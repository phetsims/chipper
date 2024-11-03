// Copyright 2020-2024, University of Colorado Boulder

/**
 * Prints out a comma-separated list of repos that this repository depends on (used by things like CT)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import getPhetLibs from '../grunt/getPhetLibs.js';
import assert from 'assert';

assert( typeof process.argv[ 2 ] === 'string', 'Provide the repo name as the first parameter' );
const repo = process.argv[ 2 ];

const dependencies = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ).sort();

console.log( dependencies.join( ',' ) );