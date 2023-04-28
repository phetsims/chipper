// Copyright 2021-2023, University of Colorado Boulder
const fs = require( 'fs' );
const phetioCompareAPIs = require( './phetioCompareAPIs' );
const _ = require( 'lodash' );
const jsondiffpatch = require( '../../../sherpa/lib/jsondiffpatch-v0.3.11.umd' ).create( {} );
const assert = require( 'assert' );

/**
 * Compare two sets of APIs using phetioCompareAPIs.
 *
 * @param {string[]} repos
 * @param {Object} proposedAPIs - map where key=repo, value=proposed API for that repo
 * @param {Object} [options]
 * @returns {boolean} ok
 */
module.exports = async ( repos, proposedAPIs, options ) => {
  let ok = true;
  options = _.extend( {
    delta: false,
    compareBreakingAPIChanges: true
  }, options );

  repos.forEach( repo => {

    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) );
    const phetioSection = packageObject.phet[ 'phet-io' ] || {};

    // Fails on missing file or parse error.
    const referenceAPI = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api.json`, 'utf8' ) );
    const proposedAPI = proposedAPIs[ repo ];

    const comparisonData = phetioCompareAPIs( referenceAPI, proposedAPI, _, assert, {
      compareBreakingAPIChanges: options.compareBreakingAPIChanges,
      compareDesignedAPIChanges: !!phetioSection.compareDesignedAPIChanges // determined from the package.json flag
    } );

    if ( comparisonData.breakingProblems.length ) {
      ok = false;
      console.log( `${repo} BREAKING PROBLEMS` );
      console.log( comparisonData.breakingProblems.join( '\n' ) );
      console.log( '\n' );
    }

    if ( comparisonData.designedProblems.length ) {
      ok = false;
      console.log( `${repo} DESIGN PROBLEMS` );
      console.log( comparisonData.designedProblems.join( '\n' ) );
      console.log( '\n' );
    }

    if ( options.delta ) {
      const delta = jsondiffpatch.diff( referenceAPI, proposedAPI );
      if ( delta ) {
        console.log( JSON.stringify( delta, null, 2 ) );
      }
    }
  } );

  return ok;
};