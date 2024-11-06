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
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { Repo } from '../../../perennial-alias/js/common/PerennialTypes.js';

// Construct the command string with brace expansion
const runnable = process.platform.startsWith( 'win' ) ? 'swc.cmd' : 'swc';
const runnablePath = path.join( `chipper/node_modules/.bin/${runnable}` );

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
const getSubdirectories = ( repo: string, additionalBrands: string[] ) => {
  const subdirs = [ 'js', 'images', 'mipmaps', 'sounds' ];

  repo === 'phet-io-wrappers' && subdirs.push( 'common' );
  repo === 'phet-io-sim-specific' && subdirs.push( 'repos' );
  repo === 'my-solar-system' && subdirs.push( 'shaders' );
  repo === 'alpenglow' && subdirs.push( 'wgsl' );
  repo === 'sherpa' && subdirs.push( 'lib' );
  repo === 'brand' && subdirs.push( 'phet', 'phet-io', 'adapted-from-phet', ...additionalBrands );

  return subdirs.map( subdir => `${repo}/${subdir}/` );
};

// TODO: factor out child process https://github.com/phetsims/perennial/issues/373
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

const spawnTranspile = ( repos: string[], watch: boolean, additionalBrands: string[] ) => {
  const argsString = [
    '--config-file', 'chipper/.swcrc',
    '-s', 'inline',
    ..._.flatten( repos.map( repo => getSubdirectories( repo, additionalBrands ) ) ),
    '-d', 'chipper/dist/js/'
  ];

  if ( watch ) {
    argsString.push( '--watch' );
  }

  // console.log( 'Executing: ', runnablePath, argsString.join( ' ' ) );
  return spawnCommand( runnablePath, argsString );
};

export default async function transpileSWC( repos: Repo[], isWatchMode: boolean, additionalBrands: string[], clean = false ): Promise<void> {

  if ( clean ) {
    const distPath = path.resolve( __dirname, '../../../chipper/dist/js' );
    if ( fs.existsSync( distPath ) ) {
      fs.rmSync( distPath, { recursive: true, force: true } );
    }
  }

  const chunks = _.chunk( repos, 75 );

  console.log( `Transpiling code for ${repos.length} repositories, split into ${chunks.length} chunks...` );

  await Promise.all( chunks.map( chunkedRepos => spawnTranspile( chunkedRepos, isWatchMode, additionalBrands ) ) );
  console.log( 'SWC transpile completed successfully.' );
}