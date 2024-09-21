// Copyright 2024, University of Colorado Boulder

/**
 * Spawns an swc process to transpile code into chipper/dist/js
 *
 * Usage:
 * cd chipper/
 * node_modules/.bin/tsx js/scripts/transpile-swc.ts
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// @ts-expect-error
const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );

// For iterating, just a minimal subset of repos is used
// const activeRepos = fs.readFileSync( path.join( __dirname, '..', '..', '..', 'perennial', 'data', 'active-common-sim-repos' ), 'utf-8' ) .split( '\n' ) .filter( repo => repo.trim().length > 0 ) .concat( [ 'buoyancy', 'density-buoyancy-common', 'acid-base-solutions', 'chipper', 'sherpa' ] );

// Read active repositories
const activeRepos = fs.readFileSync( path.join( __dirname, '..', '..', '..', 'perennial', 'data', 'active-repos' ), 'utf-8' ).split( '\n' ).filter( repo => repo.trim().length > 0 );

const getSubdirectories = ( repo: string ) => {
  const list = [ 'js', 'mipmaps', 'sounds', 'images' ];
  repo === 'sherpa' && list.push( 'lib' );
  repo === 'brand' && list.push( 'phet', 'phet-io', 'adapted-from-phet' );
  return list.join( ',' );
};

// Construct the command string with brace expansion
const argsString = `chipper/node_modules/.bin/swc --config-file chipper/.swcrc -s inline ${activeRepos.map( repo => `${repo}/{${getSubdirectories( repo )}}/` ).join( ' ' )} -d chipper/dist/js/ --watch`;

// console.log( `Executing: ${argsString}` );
console.log( `Transpiling code for ${activeRepos.length} repositories...` );

function spawnCommand( command: string ): Promise<void> {
  return new Promise( ( resolve, reject ) => {
    const child = spawn( command, {
      cwd: path.join( __dirname, '..', '..', '..' ),
      shell: true, // Enable shell to handle brace expansion
      stdio: 'inherit' // Inherit stdio to display output directly
    } );

    child.on( 'error', error => reject( error ) );

    child.on( 'close', code => {
      if ( code !== 0 ) {
        reject( new Error( `Process exited with code ${code}` ) );
      }
      else {
        console.log( 'Child process completed successfully.' );
        resolve();
      }
    } );
  } );
}

( async () => {
  try {
    await spawnCommand( argsString );
    console.log( 'Script completed successfully.' );
  }
  catch( error ) {
    console.error( 'Error:', error );
    process.exit( 1 ); // Exit with failure code
  }
} )();