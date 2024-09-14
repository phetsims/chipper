// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const repo = getRepo();

const formatPhetioAPI = require( '../../phet-io/formatPhetioAPI' );
const getSimList = require( '../../common/getSimList' );
const generatePhetioMacroAPI = require( '../../phet-io/generatePhetioMacroAPI' );
const fs = require( 'fs' );
const parseGruntOptions = require( './util/parseGruntOptions' );

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

const sims = getSimList().length === 0 ? [ repo ] : getSimList();

// Ideally transpilation would be a no-op if the watch process is running. However, it can take 2+ seconds on
// macOS to check all files, and sometimes much longer (50+ seconds) if the cache mechanism is failing.
// So this "skip" is a band-aid until we reduce those other problems.
const skipTranspile = grunt.option( 'transpile' ) === false;
if ( !skipTranspile ) {
  const startTime = Date.now();

  const Transpiler = require( '../common/Transpiler' );
  const transpiler = new Transpiler( { silent: true } );

  transpiler.transpileAll();
  const transpileTimeMS = Date.now() - startTime;

  // Notify about long transpile times, in case more people need to skip
  if ( transpileTimeMS >= 5000 ) {
    grunt.log.writeln(
      `generate-phet-io-api transpilation took ${transpileTimeMS} ms`
    );
  }
}
else {
  grunt.log.writeln( 'Skipping transpilation' );
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
    const filePath = `${dir}/${sim}-phet-io-api${grunt.option( 'temporary' ) ? '-temporary' : ''}.json`;
    const api = results[ sim ];
    api && fs.writeFileSync( filePath, formatPhetioAPI( api ) );
  } );
} )();