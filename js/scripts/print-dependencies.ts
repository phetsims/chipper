// Copyright 2020-2024, University of Colorado Boulder

/**
 * Prints out a comma-separated list of repos that this repository depends on (used by things like CT)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import getPhetLibs from '../grunt/getPhetLibs.js';

assert( typeof process.argv[ 2 ] === 'string', 'Provide the repo name as the first parameter' );
const repo = process.argv[ 2 ];

const dependencies = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ).sort();

console.log( dependencies.join( ',' ) );