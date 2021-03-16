// Copyright 2021, University of Colorado Boulder

const _ = require( 'lodash' ); // eslint-disable-line
const fs = require( 'fs' );
const phetioCompareAPIs = require( './phetioCompareAPIs' );
const getSimList = require( './getSimList' );

/**
 * Compare two sets of APIs
 * USAGE:
 * cd chipper
 * node js/phet-io/compare-apis.js [--delta] [--simList=path] [--sims=sim1,sim2,...] [--mod=N]
 *
 * EXAMPLE:
 * node js/phet-io/compare-apis.js --delta
 *
 * OPTIONS:
 * --delta: shows the entire delta, otherwise just shows breaking changes
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const repos = getSimList();
const args = process.argv.slice( 2 );

const API_DIR = '../phet-io/api';
const TMP_DIR = '../phet-io/api-temporary';

const jsondiffpatch = require( 'jsondiffpatch' ).create( {} );

repos.forEach( repo => {

  // Fails on missing file or parse error.
  const api1 = JSON.parse( fs.readFileSync( `${API_DIR}/${repo}.json`, 'utf8' ) );
  const api2 = JSON.parse( fs.readFileSync( `${TMP_DIR}/${repo}.json`, 'utf8' ) );

  const problems = phetioCompareAPIs( api1, api2, _ );

  if ( problems.length ) {
    console.log( repo );
    console.log( problems.join( '\n' ) );
    console.log( '\n' );
  }

  if ( args.includes( '--delta' ) ) {
    const delta = jsondiffpatch.diff( api1, api2 );
    if ( delta ) {
      console.log( JSON.stringify( delta, null, 2 ) );
    }
  }
} );