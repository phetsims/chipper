// Copyright 2013-2025, University of Colorado Boulder

/**
 *
 * Compares the phet-io-api against the reference version(s) if this sim's package.json marks compareDesignedAPIChanges.
 * This will by default compare designed changes only. Options:
 * --sims=... a list of sims to compare (defaults to the sim in the current dir)
 * --simList=... a file with a list of sims to compare (defaults to the sim in the current dir)
 * --stable, generate the phet-io-apis for each phet-io sim considered to have a stable API (see perennial-alias/data/phet-io-api-stable)
 * --delta, by default a breaking-compatibility comparison is done, but --delta shows all changes
 * --temporary, compares API files in the temporary directory (otherwise compares to freshly generated APIs)
 * --compareBreakingAPIChanges - add this flag to compare breaking changes in addition to designed changes
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import getSimList from '../../common/getSimList.js';
import transpile from '../../common/transpile.js';
import generatePhetioMacroAPI, { PhetioAPIs } from '../../phet-io/generatePhetioMacroAPI.js';
import phetioCompareAPISets from '../../phet-io/phetioCompareAPISets.js';
import getPhetLibs from '../getPhetLibs.js';

const repo = getRepo();
const sims: string[] = getSimList().length === 0 ? [ repo ] : getSimList();
const temporary = getOption( 'temporary' );
let proposedAPIs: PhetioAPIs | null = null;
const needsTranspile = isOptionKeyProvided( 'transpile' ) ? getOption( 'transpile' ) : true;

( async () => {
  if ( temporary ) {
    proposedAPIs = {};
    sims.forEach( sim => {
      proposedAPIs![ sim ] = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api-temporary.json`, 'utf8' ) );
    } );
  }
  else {

    const repos = new Set<string>();
    sims.forEach( sim => getPhetLibs( sim ).forEach( lib => repos.add( lib ) ) );
    needsTranspile && await transpile( {
      repos: Array.from( repos ),
      silent: true
    } );

    proposedAPIs = await generatePhetioMacroAPI( sims, {
      showProgressBar: sims.length > 1,
      showMessagesFromSim: false
    } );
  }

// Don't add to options object if values are `undefined` (as _.extend will keep those entries and not mix in defaults
  const options: IntentionalAny = {};
  if ( getOption( 'delta' ) ) {
    options.delta = getOption( 'delta' );
  }
  if ( getOption( 'compareBreakingAPIChanges' ) ) {
    options.compareBreakingAPIChanges = getOption( 'compareBreakingAPIChanges' );
  }
  const ok = await phetioCompareAPISets( sims, proposedAPIs, options );
  if ( !ok ) {
    console.log( 'PhET-iO API comparison failed' );
    process.exit( 1 );
  }

} )();