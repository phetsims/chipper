// Copyright 2024, University of Colorado Boulder

import assert from 'assert';
import _ from 'lodash';
import { Repo } from '../../../perennial-alias/js/common/PerennialTypes.js';
import getOption from '../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo, { getRepos } from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

type TranspileOptions = {

  // Transpile all repos
  all: boolean;

  // Delete of the output directory before transpiling
  clean: boolean;

  // Continue watching all directories and transpile on detected changes.
  watch: boolean;

  // List of repos to transpile, if not doing all
  repos: Repo[];

  silent: boolean; // any logging output.

  brands: string[]; // Extra brands in the brand repo to transpile.
};

/**
 * Function to support transpiling on the project. See grunt transpile
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
export default async function transpile( providedOptions: Partial<TranspileOptions> ): Promise<void> {
  const start = Date.now();

  const options = _.assignIn( {
    all: false,
    silent: false,
    clean: false,
    watch: false,
    repos: []
  }, providedOptions );

  assert( options.repos.length > 0 || options.all, 'must include repos or --all' );
  const repos = options.all ? getActiveRepos() : options.repos;

  // We can't use --delete-dir-on-start, because we are operating multiple swc instances in child processes.
  if ( options.clean ) {
    const distPath = path.resolve( __dirname, '../../../chipper/dist/js' );
    if ( fs.existsSync( distPath ) ) {
      fs.rmSync( distPath, { recursive: true, force: true } );
    }
  }

  const chunks = _.chunk( repos, 75 );

  !options.silent && console.log( `Transpiling code for ${repos.length} repositories, split into ${chunks.length} chunks...` );

  await Promise.all( chunks.map( chunkedRepos => spawnTranspile( chunkedRepos, options.watch, options.brands || [] ) ) );

  !options.silent && console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );
  !options.silent && options.watch && console.log( 'Watching...' );
}

// Parse command line options into an object for the module
export const getTranspileOptions = ( options?: Partial<TranspileOptions> ): TranspileOptions => {

  const repo = getRepo();
  const repos = getRepos();

  return _.assignIn( {
    repos: repos.length > 0 ? repos : [ repo ],
    brands: getOption( 'brands' ) ? getOption( 'brands' ).split( ',' ) : [],
    all: !!getOption( 'all' ),
    clean: !!getOption( 'clean' ),
    silent: !!getOption( 'silent' ),
    watch: !!getOption( 'watch' )
  }, options );
};

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
    ..._.flatten( repos.map( repo => getSubdirectories( repo, additionalBrands ) ) ),
    '-d', 'chipper/dist/js/'
  ];

  if ( watch ) {
    argsString.push( '--watch' );
  }

  // console.log( 'Executing: ', runnablePath, argsString.join( ' ' ) );
  return spawnCommand( runnablePath, argsString );
};