// Copyright 2024, University of Colorado Boulder
/**
 * Type checks *.ts files. Named after deno check. Automatically uses -b as appropriate.
 *
 * Usage:
 * grunt check
 *
 * Options (can be combined):
 * --everything: check all repos
 * --clean: clean before checking
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.ts';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import fixEOL from '../fixEOL.js';

const repo = getRepo();

// Utility function to spawn a child process with inherited stdio
const runCommand = ( command: string, args: string[], cwd: string ): Promise<void> => {
  return new Promise( ( resolve, reject ) => {
    const child = spawn( command, args, {
      cwd: cwd,
      stdio: 'inherit', // Inherit stdio to preserve colors and interactive output
      shell: process.platform.startsWith( 'win' )
    } );

    child.on( 'error', error => reject( error ) );
    child.on( 'close', code => {
      if ( code !== 0 ) { reject( new Error( `Command "${command} ${args.join( ' ' )}" exited with code ${code}` ) ); }
      else { resolve(); }
    } );
  } );
};

export const checkTask = ( async () => {
  try {
    const everything = getOption( 'everything' );
    const clean = getOption( 'clean' );

    // This task defaults to pretty output, but can be overridden with --pretty=false
    const pretty = getOption( 'pretty' ) === undefined || getOption( 'pretty' ) === true;

    if ( everything ) {
      writeEverythingTSConfigFile();
    }

    const tsconfigDir = everything ? '../chipper/tsconfig/all' : `../${repo}`;
    const pathToTSC = everything ? '../../../chipper/node_modules/typescript/bin/tsc'
                                 : '../chipper/node_modules/typescript/bin/tsc';

    if ( clean ) {
      await runCommand( 'node', [ pathToTSC, '-b', '--clean' ], tsconfigDir );
    }

    await runCommand( 'node', [ pathToTSC, '-b', '--pretty', pretty + '' ], tsconfigDir );
  }
  catch( error ) {

    // error printed to console above via inherit
    process.exit( 1 ); // Exit with a failure code
  }
} )();

/**
 * Write an aggregate tsconfig file that checks all entry points.
 */
function writeEverythingTSConfigFile(): void {
  const activeRepos = fs.readFileSync( '../perennial-alias/data/active-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );

  const filteredRepos = activeRepos.filter( repo => {
    return fs.existsSync( `../${repo}/tsconfig.json` ) &&
           // TODO: include these repos, see https://github.com/phetsims/chipper/issues/1487
           repo !== 'phet-lib' && repo !== 'phet-vite-demo';
  } );

  const json = {
    references: filteredRepos.map( repo => ( { path: `../../../${repo}` } ) )
  };

  const fileOutput = `/**
 * File auto-generated by check.ts 
 *
 * Explicitly list all entry points that we want to type check.
 * Imported images/mipmaps/sounds are still type checked.
 * This structure was determined in https://github.com/phetsims/chipper/issues/1245
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
${JSON.stringify( json, null, 2 )}`;

  fs.writeFileSync( '../chipper/tsconfig/all/tsconfig.json', fixEOL( fileOutput ) );
}