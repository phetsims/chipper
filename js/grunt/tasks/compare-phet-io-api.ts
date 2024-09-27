// Copyright 2013-2024, University of Colorado Boulder

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
import * as grunt from 'grunt';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const getSimList = require( '../../common/getSimList' );
const generatePhetioMacroAPI = require( '../../phet-io/generatePhetioMacroAPI' );
const fs = require( 'fs' );

const repo = getRepo();
const sims: string[] = getSimList().length === 0 ? [ repo ] : getSimList();
const temporary = getOption( 'temporary' );
let proposedAPIs: Record<string, string> | null = null;

( async () => {
  if ( temporary ) {
    proposedAPIs = {};
    sims.forEach( sim => {
      proposedAPIs![ sim ] = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api-temporary.json`, 'utf8' ) );
    } );
  }
  else {

    const Transpiler = require( '../../common/Transpiler' );
    const transpiler = new Transpiler( { silent: true } );

    transpiler.transpileAll();
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
  const ok = await require( '../../phet-io/phetioCompareAPISets' )( sims, proposedAPIs, options );
  !ok && grunt.fail.fatal( 'PhET-iO API comparison failed' );

} )();