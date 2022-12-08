// Copyright 2021-2022, University of Colorado Boulder

/**
 * Parses command line arguments--sims=sim1,sim2,... or --simList=path/to/filename to get a list of sims.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const fs = require( 'fs' );

'use strict';

module.exports = () => {
  const args = process.argv.slice( 2 );

  // if the arg is just a flag, then the callback will be called with a null parameter
  const processKey = ( key, callback ) => {
    const prefix = `--${key}`;
    const values = args.filter( arg => arg.startsWith( prefix ) );
    if ( values.length === 1 ) {
      if ( values[ 0 ].startsWith( `${prefix}=` ) ) {
        callback( values[ 0 ].substring( prefix.length + 1 ) );
      }
      else {
        callback( null );
      }
    }
    else if ( values.length > 1 ) {
      console.log( `Too many --${prefix}... specified` );
      process.exit( 1 );
    }
  };

  let repos = [];
  processKey( 'simList', value => {
    const contents = fs.readFileSync( value, 'utf8' ).trim();
    repos = contents.split( '\n' ).map( sim => sim.trim() );
  } );
  processKey( 'stable', () => {
    const contents = fs.readFileSync( '../perennial-alias/data/phet-io-api-stable', 'utf8' ).trim();
    repos = contents.split( '\n' ).map( sim => sim.trim() );
  } );
  processKey( 'sims', value => {
    repos = value.split( ',' );
  } );

  return repos;
};