// Copyright 2021-2025, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import _ from 'lodash';
import optionize from '../../../phet-core/js/optionize.js';
import phetioCompareAPIs, { PhetioCompareAPIsOptions } from '../browser-and-node/phetioCompareAPIs.js';
import { PhetioAPIs } from './generatePhetioMacroAPI.js';

const jsondiffpatch = require( '../../../sherpa/lib/jsondiffpatch-v0.3.11.umd' ).create( {} );

type SelfOptions = {
  delta?: boolean;
};
type ParentOptions = PhetioCompareAPIsOptions;
type PhetioCompareAPISetsOptions = SelfOptions & ParentOptions;

/**
 * Compare two sets of APIs using phetioCompareAPIs.
 */
export default async ( repos: string[], proposedAPIs: PhetioAPIs, providedOptions?: PhetioCompareAPISetsOptions ): Promise<boolean> => {

  const options = optionize<PhetioCompareAPISetsOptions, SelfOptions, ParentOptions>()( {
    delta: false,
    compareBreakingAPIChanges: true
  }, providedOptions );

  let ok = true;

  repos.forEach( ( repo: string ) => {

    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) );
    const phetioSection = packageObject.phet[ 'phet-io' ] || {};

    // Fails on missing file or parse error.
    const referenceAPI = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api.json`, 'utf8' ) );
    const proposedAPI = proposedAPIs[ repo ];

    if ( !proposedAPI ) {
      throw new Error( `No proposedAPI for repo: ${repo}` );
    }

    const comparisonData = phetioCompareAPIs( referenceAPI, proposedAPI, _, {
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