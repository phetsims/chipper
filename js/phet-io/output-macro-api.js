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
 *
 * USAGE:
 * cd chipper
 * node js/phet-io/output-macro-api.js [--sims=sim1,sim2,...] [--chunkSize=N] [--slice=N] [--mod=N] [--out=filename.json]
 *
 * OPTIONS:
 * It will default to include all phet-io sims unless you specify a subset
 * --sims=sim1,sim2: a listed subset of sims
 * --slice=take a slice of all phet-io sims
 * --mod=take a modulus of all phet-io sims (every Nth sim)
 *
 * --out=filename: where to output the macro API file.  JSON suffix is recommended but not required.
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