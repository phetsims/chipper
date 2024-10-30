// Copyright 2024, University of Colorado Boulder

/**
 * Spawns an swc process to transpile code into chipper/dist/js
 *
 * Usage:
 * cd chipper/
 * sage run js/scripts/transpile-swc.ts --watch
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

// Parse command line arguments
const args = process.argv.slice( 2 );
const isWatchMode = args.includes( '--watch' );

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

// TODO: factor out child process https://github.com/phetsims/chipper/issues/1354
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

const spawnTranspile = ( repos: string[], watch: boolean ) => {
  const argsString = [
    '--config-file', 'chipper/.swcrc',
    '-s', 'inline',
    ..._.flatten( repos.map( repo => getSubdirectories( repo ) ) ),
    '-d', 'chipper/dist/js/'
  ];

  if ( watch ) {
    argsString.push( '--watch' );
  }

  // console.log( 'Executing: ', runnablePath, argsString.join( ' ' ) );
  return spawnCommand( runnablePath, argsString );
};

async function main( repos = activeRepos ): Promise<void> {
  const chunks = _.chunk( repos, 75 );

  console.log( `Transpiling code for ${repos.length} repositories, split into ${chunks.length} chunks...` );

  await Promise.all( chunks.map( chunkedRepos => spawnTranspile( chunkedRepos, isWatchMode ) ) );
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