// Copyright 2021-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
import _ from 'lodash';
import phetioCompareAPIs from './phetioCompareAPIs.js';

const jsondiffpatch = require( '../../../sherpa/lib/jsondiffpatch-v0.3.11.umd' ).create( {} );

type API = unknown;

type PhetioCompareAPISetssOptions = {
  delta: boolean;
} & PhetioCompareAPIsOptions;

// TODO: Use this in https://github.com/phetsims/chipper/issues/1526
type PhetioCompareAPIsOptions = {
  compareBreakingAPIChanges: boolean;
  compareDesignedAPIChanges: boolean;
};

/**
 * Compare two sets of APIs using phetioCompareAPIs.
 */
export default async ( repos: string[], proposedAPIs: Record<string, API>, options?: Partial<PhetioCompareAPISetssOptions> ): Promise<boolean> => {
  let ok = true;
  options = _.assignIn( {
    delta: false,
    compareBreakingAPIChanges: true
  }, options );

  repos.forEach( ( repo: string ) => {

    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) );
    const phetioSection = packageObject.phet[ 'phet-io' ] || {};

    // Fails on missing file or parse error.
    const referenceAPI = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api.json`, 'utf8' ) );
    const proposedAPI = proposedAPIs[ repo ];

    if ( !proposedAPI ) {
      throw new Error( `No proposedAPI for repo: ${repo}` );
    }

    const comparisonData = phetioCompareAPIs( referenceAPI, proposedAPI, _, assert, {
      compareBreakingAPIChanges: options.compareBreakingAPIChanges,
      compareDesignedAPIChanges: !!phetioSection.compareDesignedAPIChanges // determined from the package.json flag
    } );

    if ( comparisonData.breakingProblems.length ) {
      ok = false;
      console.error( `${repo} BREAKING PROBLEMS` );
      console.error( comparisonData.breakingProblems.join( '\n' ) );
      console.error( '\n' );
    }

    if ( comparisonData.designedProblems.length ) {
      ok = false;
      console.error( `${repo} DESIGN PROBLEMS` );
      console.error( comparisonData.designedProblems.join( '\n' ) );
      console.error( '\n' );
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