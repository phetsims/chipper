// Copyright 2013-2024, University of Colorado Boulder

import getRepo from './util/getRepo';

/**
 * Output the PhET-iO API as JSON to phet-io-sim-specific/api.
 * Options
 * --sims=... a list of sims to compare (defaults to the sim in the current dir)
 * --simList=... a file with a list of sims to compare (defaults to the sim in the current dir)
 * --stable - regenerate for all "stable sims" (see perennial/data/phet-io-api-stable/)
 * --temporary - outputs to the temporary directory
 * --transpile=false - skips the transpilation step. You can skip transpilation if a watch process is handling it.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

const formatPhetioAPI = require( '../../phet-io/formatPhetioAPI' );
const getSimList = require( '../../common/getSimList' );
const generatePhetioMacroAPI = require( '../../phet-io/generatePhetioMacroAPI' );
const fs = require( 'fs' );
import getOption from './util/getOption';

const sims: string[] = getSimList().length === 0 ? [ repo ] : getSimList();

// Ideally transpilation would be a no-op if the watch process is running. However, it can take 2+ seconds on
// macOS to check all files, and sometimes much longer (50+ seconds) if the cache mechanism is failing.
// So this "skip" is a band-aid until we reduce those other problems.
const skipTranspile = getOption( 'transpile' ) === false;
if ( !skipTranspile ) {
  const startTime = Date.now();

  const Transpiler = require( '../../common/Transpiler' );
  const transpiler = new Transpiler( { silent: true } );

  transpiler.transpileAll();
  const transpileTimeMS = Date.now() - startTime;

  // Notify about long transpile times, in case more people need to skip
  if ( transpileTimeMS >= 5000 ) {
    console.log( `generate-phet-io-api transpilation took ${transpileTimeMS} ms` );
  }
}
else {
  console.log( 'Skipping transpilation' );
}

( async () => {
  const results = await generatePhetioMacroAPI( sims, {
    showProgressBar: sims.length > 1,
    throwAPIGenerationErrors: false // Write as many as we can, and print what we didn't write
  } );
  sims.forEach( sim => {
    const dir = `../phet-io-sim-specific/repos/${sim}`;
    try {
      fs.mkdirSync( dir );
    }
    catch( e ) {
      // Directory exists
    }
    const filePath = `${dir}/${sim}-phet-io-api${getOption( 'temporary' ) ? '-temporary' : ''}.json`;
    const api = results[ sim ];
    api && fs.writeFileSync( filePath, formatPhetioAPI( api ) );
  } );
} )();