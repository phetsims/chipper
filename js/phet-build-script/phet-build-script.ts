// Copyright 2022, University of Colorado Boulder
// Entry point for phet build commands forwarded from grunt

import * as fs from 'fs'; // eslint-disable-line bad-sim-text

const args: string[] = process.argv.slice( 2 ); // eslint-disable-line no-undef

const assert = ( predicate: unknown, message: string ) => {
  if ( !predicate ) {
    throw new Error( message );
  }
};

const command = args[ 0 ];

// https://unix.stackexchange.com/questions/573377/do-command-line-options-take-an-equals-sign-between-option-name-and-value
const repos = args.filter( arg => arg.startsWith( '--repo=' ) ).map( arg => arg.split( '=' )[ 1 ] );
assert && assert( repos.length === 1, 'should have 1 repo' );
const repo = repos[ 0 ];
if ( command === 'clean' ) {
  const buildDirectory = `../${repo}/build`;

  if ( fs.existsSync( buildDirectory ) ) {
    fs.rmSync( buildDirectory, { recursive: true, force: true } );
  }

  fs.mkdirSync( buildDirectory );
}