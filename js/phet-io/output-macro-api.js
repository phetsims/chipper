// Copyright 2021, University of Colorado Boulder

const _ = require( 'lodash' ); // eslint-disable-line
const fs = require( 'fs' );
const generateMacroAPI = require( './generateMacroAPI' );
const formatPhetioAPI = require( './formatPhetioAPI' );

// constants
const contents = fs.readFileSync( '../perennial/data/phet-io', 'utf8' ).trim();
let repos = contents.split( '\n' ).map( sim => sim.trim() );

/**
 * Runs generate-phet-io-api for the specified simulations, or all phet-io sims if not specified.
 * This is in perennial since it should work across multiple versions, and may use tools like execute()
 *
 * USAGE:
 * cd ${root containing all repos}
 * node perennial/js/scripts/compare-macro-apis.js [--sims=sim1,sim2,...] [--chunkSize=N] [--slice=N] [--mod=N]
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
( async () => {

  const args = process.argv.slice( 2 );
  let outputFile = null;
  const processKey = ( key, callback ) => {
    const prefix = `--${key}=`;
    const values = args.filter( arg => arg.startsWith( prefix ) );
    if ( values.length === 1 ) {
      callback( values[ 0 ].substring( prefix.length ) );
    }
    else if ( values.length > 1 ) {
      console.log( `Too many --${prefix}... specified` );
      process.exit( 1 );
    }
  };
  processKey( 'sims', value => {
    repos = value.split( ',' );
    console.error( `sims: ${repos.join( ', ' )}` );
  } );
  processKey( 'slice', value => {
    repos = repos.slice( parseInt( value, 10 ) );
  } );
  processKey( 'mod', value => {
    const newArray = [];
    for ( let i = 0; i < repos.length; i += parseInt( value, 10 ) ) {
      newArray.push( repos[ i ] );
    }
    repos = newArray;
    console.error( `mod: ${repos.join( ', ' )}` );
  } );
  processKey( 'out', value => {
    outputFile = value;
  } );

  // console.log( 'running on repos: ' + repos.join( ', ' ) );
  const chunkSize = 4;
  const results = await generateMacroAPI( repos, {
    showProgressBar: true, // Interferes with file output
    chunkSize: chunkSize,
    showMessagesFromSim: false // must be pure JSON
  } );

  const result = formatPhetioAPI( results );
  if ( outputFile ) {
    fs.writeFileSync( outputFile, result );
  }
  else {
    console.log( result );
  }
} )();