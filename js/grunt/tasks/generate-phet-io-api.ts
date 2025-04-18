// Copyright 2013-2025, University of Colorado Boulder

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

import fs from 'fs';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getSimList from '../../common/getSimList.js';
import transpile from '../../common/transpile.js';
import formatPhetioAPI from '../../phet-io/formatPhetioAPI.js';
import generatePhetioMacroAPI from '../../phet-io/generatePhetioMacroAPI.js';
import getPhetLibs from '../getPhetLibs.js';

const repo = getRepo();
const sims: string[] = getSimList().length === 0 ? [ repo ] : getSimList();

// Ideally transpilation would be a no-op if the watch process is running. However, it can take 2+ seconds on
// macOS to check all files, and sometimes much longer (50+ seconds) if the cache mechanism is failing.
// So this "skip" is a band-aid until we reduce those other problems.
const skipTranspile = getOption( 'transpile' ) === false;

( async () => {

  if ( !skipTranspile ) {
    const startTime = Date.now();

    const repos = new Set<string>();
    sims.forEach( sim => getPhetLibs( sim ).forEach( lib => repos.add( lib ) ) );
    await transpile( {
      repos: Array.from( repos ),
      silent: true
    } );

    const transpileTimeMS = Date.now() - startTime;

    // Notify about long transpile times, in case more people need to skip
    if ( transpileTimeMS >= 5000 ) {
      console.log( `generate-phet-io-api transpilation took ${transpileTimeMS} ms` );
    }
  }
  else {
    console.log( 'Skipping transpilation' );
  }

  const results = await generatePhetioMacroAPI( sims, {
    workers: getOption( 'workers' ) || 4,
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