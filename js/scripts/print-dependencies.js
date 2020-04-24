// Copyright 2020, University of Colorado Boulder

/**
 * Prints out a comma-separated list of repos that this repository depends on (used by things like CT)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
'use strict';

const getPhetLibs = require( '../grunt/getPhetLibs' );
const assert = require( 'assert' );

assert( typeof process.argv[ 2 ] === 'string', 'Provide the repo name as the first parameter' );
const repo = process.argv[ 2 ];

const dependencies = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ).sort();

console.log( dependencies.join( ',' ) );
