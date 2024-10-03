// Copyright 2024, University of Colorado Boulder

/**
 * Spawns an swc process to transpile code into chipper/dist/js
 *
 * Usage:
 * cd chipper/
 * npx tsx js/scripts/transpile-swc.ts
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { spawn } from 'child_process';
import _ from 'lodash';
import path from 'path';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos';

// Read active repositories
const activeRepos = getActiveRepos();

// Construct the command string with brace expansion
const runnable = process.platform.startsWith( 'win' ) ? 'swc.cmd' : 'swc';
const runnablePath = path.join( `chipper/node_modules/.bin/${runnable}` );

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
const getSubdirectories = ( repo: string ) => {
  const subdirs = [ 'js', 'images', 'mipmaps', 'sounds' ];

  repo === 'phet-io-wrappers' && subdirs.push( 'common' );
  repo === 'phet-io-sim-specific' && subdirs.push( 'repos' );
  repo === 'my-solar-system' && subdirs.push( 'shaders' );
  repo === 'alpenglow' && subdirs.push( 'wgsl' );
  repo === 'sherpa' && subdirs.push( 'lib' );
  repo === 'brand' && subdirs.push( 'phet', 'phet-io', 'adapted-from-phet' );

  return subdirs.map( subdir => `${repo}/${subdir}/` );
};

function spawnCommand( command: string, args: string[] ): Promise<void> {
  return new Promise( ( resolve, reject ) => {
    const child = spawn( command, args, {
      cwd: path.resolve( __dirname, '../../../' ),
      shell: true, // Important for windows.
      stdio: 'inherit' // Inherit stdio to display output directly
    } );

    child.on( 'error', error => reject( error ) );

    child.on( 'close', code => {
      if ( code !== 0 ) {
        reject( new Error( `Process exited with code ${code}` ) );
      }
      else {
        resolve();
      }
    } );
  } );
}

const spawnWatch = ( repos: string[] ) => {
  const argsString = [
    '--config-file', 'chipper/.swcrc',
    '-s', 'inline',
    ..._.flatten( repos.map( repo => getSubdirectories( repo ) ) ),
    '-d', 'chipper/dist/js/',
    '--watch'
  ];
  // console.log( 'Executing: ', runnablePath, argsString.join( ' ' ) );
  return spawnCommand( runnablePath, argsString );
};

async function main( repos = activeRepos ): Promise<void> {
  console.log( `Transpiling code for ${repos.length} repositories...` );
  await Promise.all( _.chunk( repos, 75 ).map( chunkedRepos => spawnWatch( chunkedRepos ) ) );
  console.log( 'SWC transpile completed successfully.' );
}

( async () => {
  try {
    await main();
  }
  catch( error ) {
    console.error( 'Error:', error );
    process.exit( 1 ); // Exit with failure code
  }
} )();