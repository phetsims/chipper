// Copyright 2024-2025, University of Colorado Boulder

/**
 * Function to support transpiling on the project. See grunt transpile
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { Repo } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import dirname from '../../../perennial-alias/js/common/dirname.js';
import execute from '../../../perennial-alias/js/common/execute.js';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos.js';
import getOption, { isOptionKeyProvided } from '../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import optionize from '../../../phet-core/js/optionize.js';

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

export type TranspileOptions = {

  // Transpile all repos
  all?: boolean;

  // Delete of the output directory before transpiling
  clean?: boolean;

  // Continue watching all directories and transpile on detected changes.
  live?: boolean;

  // List of repos to transpile, if not doing all
  repos?: Repo[];

  // suppress any logging output.
  silent?: boolean;
};

export default async function transpile( providedOptions?: TranspileOptions ): Promise<void> {
  const start = Date.now();

  const options = optionize<TranspileOptions>()( {
    all: false,
    silent: false,
    clean: false,
    live: false,
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

  const chunks = _.chunk( repos, 50 );

  !options.silent && console.log( `Transpiling code for ${repos.length} repositories, split into ${chunks.length} chunks...` );

  await Promise.all( chunks.map( chunkedRepos => spawnTranspile( chunkedRepos, options.live, options.silent ) ) );

  !options.silent && console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );
  !options.silent && options.live && console.log( 'Watching...' );
}

// Parse command line options into an object for the module
export function getTranspileCLIOptions(): TranspileOptions {

  const transpileOptions: TranspileOptions = {};

  // command line options override passed-in options
  if ( isOptionKeyProvided( 'repo' ) ) {
    transpileOptions.repos = [ getRepo() ];
  }

  // Takes precedence over repo
  if ( isOptionKeyProvided( 'repos' ) ) {
    transpileOptions.repos = getOption( 'repos' ).split( ',' );
  }

  // Takes precedence over repo and repos
  if ( isOptionKeyProvided( 'all' ) ) {
    transpileOptions.all = getOption( 'all' );
  }

  if ( isOptionKeyProvided( 'watch' ) ) {
    transpileOptions.live = getOption( 'watch' );
    console.log( '--watch is deprecated, use --live instead' );
  }

  if ( isOptionKeyProvided( 'live' ) ) {
    transpileOptions.live = getOption( 'live' );
  }

  if ( isOptionKeyProvided( 'clean' ) ) {
    transpileOptions.clean = getOption( 'clean' );
  }

  if ( isOptionKeyProvided( 'silent' ) ) {
    transpileOptions.silent = getOption( 'silent' );
  }

  return transpileOptions;
}

// Construct the command string with brace expansion
const runnable = process.platform.startsWith( 'win' ) ? 'swc.cmd' : 'swc';
const runnablePath = path.join( `chipper/node_modules/.bin/${runnable}` );

/**
 * Identify the brands that are available in the brand directory.
 * NOTE: Adding a new brand requires restarting the watch process
 */
function getBrands(): string[] {
  const pathForBrand = path.resolve( __dirname, '../../../brand/' );
  const brands = fs.readdirSync( pathForBrand ).filter( file => fs.statSync( path.join( pathForBrand, file ) ).isDirectory() );

  const omitDirectories = [ 'node_modules', '.github', 'js', '.git' ];
  const filteredBrands = brands.filter( brand => !omitDirectories.includes( brand ) );

  assert( filteredBrands.includes( 'phet' ), 'phet brand is required' );
  assert( filteredBrands.includes( 'phet-io' ), 'phet-io brand is required' );
  assert( filteredBrands.includes( 'adapted-from-phet' ), 'adapted-from-phet brand is required' );

  return filteredBrands;
}

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
const getSubdirectories = ( repo: string ) => {

  const subdirs = [ 'js', 'images', 'mipmaps', 'sounds', 'strings' ];

  repo === 'phet-io-wrappers' && subdirs.push( 'common' );
  repo === 'phet-io-sim-specific' && subdirs.push( 'repos' );
  repo === 'my-solar-system' && subdirs.push( 'shaders' );
  repo === 'alpenglow' && subdirs.push( 'wgsl' );
  repo === 'sherpa' && subdirs.push( 'lib' );
  repo === 'brand' && subdirs.push( ...getBrands() );

  return subdirs.map( subdir => `${repo}/${subdir}/` );
};

const spawnTranspile = ( repos: string[], live: boolean, silent: boolean ) => {
  const argsString = [
    '--config-file', 'chipper/.swcrc',
    ..._.flatten( repos.map( repo => getSubdirectories( repo ) ) ),
    '-d', 'chipper/dist/js/'
  ];

  // This occurrence of "--watch" is accurate, since it is the terminology used by swc
  live && argsString.push( '--watch' );

  silent && argsString.push( '--quiet' );

  const cwd = path.resolve( __dirname, '../../../' );
  return execute( runnablePath, argsString, cwd, {
    childProcessOptions: {
      stdio: 'inherit'
    }
  } );
};