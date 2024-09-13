// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const repo = getRepo();

const parseGruntOptions = require( './parseGruntOptions' );

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

const getSimList = require( '../../common/getSimList' );
const generatePhetioMacroAPI = require( '../../phet-io/generatePhetioMacroAPI' );
const fs = require( 'fs' );

const sims = getSimList().length === 0 ? [ repo ] : getSimList();
const temporary = grunt.option( 'temporary' );
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
  if ( grunt.option( 'delta' ) ) {
    options.delta = grunt.option( 'delta' );
  }
  if ( grunt.option( 'compareBreakingAPIChanges' ) ) {
    options.compareBreakingAPIChanges = grunt.option( 'compareBreakingAPIChanges' );
  }
  const ok = await require( '../phet-io/phetioCompareAPISets' )( sims, proposedAPIs, options );
  !ok && grunt.fail.fatal( 'PhET-iO API comparison failed' );

} )();