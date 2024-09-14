// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const getSimList = require( '../../common/getSimList' );
const generatePhetioMacroAPI = require( '../../phet-io/generatePhetioMacroAPI' );
const fs = require( 'fs' );
const getOption = require( './util/getOption' );

const repo = getRepo();
const sims = getSimList().length === 0 ? [ repo ] : getSimList();
const temporary = getOption( 'temporary' );
let proposedAPIs = null;

( async () => {
  if ( temporary ) {
    proposedAPIs = {};
    sims.forEach( sim => {
      proposedAPIs[ sim ] = JSON.parse( fs.readFileSync( `../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api-temporary.json`, 'utf8' ) );
    } );
  }
  else {

    const Transpiler = require( '../common/Transpiler' );
    const transpiler = new Transpiler( { silent: true } );

    transpiler.transpileAll();
    proposedAPIs = await generatePhetioMacroAPI( sims, {
      showProgressBar: sims.length > 1,
      showMessagesFromSim: false
    } );
  }

// Don't add to options object if values are `undefined` (as _.extend will keep those entries and not mix in defaults
  const options = {};
  if ( getOption( 'delta' ) ) {
    options.delta = getOption( 'delta' );
  }
  if ( getOption( 'compareBreakingAPIChanges' ) ) {
    options.compareBreakingAPIChanges = getOption( 'compareBreakingAPIChanges' );
  }
  const ok = await require( '../phet-io/phetioCompareAPISets' )( sims, proposedAPIs, options );
  !ok && grunt.fail.fatal( 'PhET-iO API comparison failed' );

} )();