// Copyright 2021, University of Colorado Boulder
const generatePhetioMacroAPI = require( './generatePhetioMacroAPI' );
const fs = require( 'fs' );
const phetioCompareAPIs = require( './phetioCompareAPIs' );
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const jsondiffpatch = require( 'jsondiffpatch' ).create( {} );

const API_DIR = '../phet-io/api';

/**
 * This task runs from the main chipper gruntfile and provides a convenient way to compare a proposed
 * API (in memory) with a reference version.
 * @param {string[]} repos
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
module.exports = async ( repos, options ) => {
  options = _.extend( { delta: false }, options );
  console.log( options.delta );
  const results = await generatePhetioMacroAPI( repos, {
    showProgressBar: true,
    showMessagesFromSim: false
  } );

  repos.forEach( repo => {

    // Fails on missing file or parse error.
    const referenceAPI = JSON.parse( fs.readFileSync( `${API_DIR}/${repo}.json`, 'utf8' ) );
    const proposedAPI = results[ repo ];

    const problems = phetioCompareAPIs( referenceAPI, proposedAPI, _ );

    if ( problems.length ) {
      console.log( repo );
      console.log( problems.join( '\n' ) );
      console.log( '\n' );
    }

    if ( options.delta ) {
      const delta = jsondiffpatch.diff( referenceAPI, proposedAPI );
      if ( delta ) {
        console.log( JSON.stringify( delta, null, 2 ) );
      }
    }
  } );
};