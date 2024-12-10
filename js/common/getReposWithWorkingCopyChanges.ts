// Copyright 2024, University of Colorado Boulder

import child_process from 'child_process';
import path from 'path';
import dirname from '../../../perennial-alias/js/common/dirname.js';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos.js';
import { Repo } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';

// @ts-expect-error ok to use import meta here
const __dirname = dirname( import.meta.url );

/**
 * Detect uncommitted changes in each repo.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default async function getReposWithWorkingCopyChanges(): Promise<Repo[]> {
  const activeRepos = getActiveRepos();

  const execOnRepos = async ( repoSubset: string[], command: string ) => {

    const promises = repoSubset.map( repo => {

      const cwd = path.resolve( __dirname, '../../../', repo );

      return new Promise( resolve => child_process.exec( command, { cwd: cwd }, error => resolve( error ) ) );
    } );
    const results = await Promise.all( promises );

    // Find out which repos have uncommitted changes
    const changedRepos = [];
    for ( let i = 0; i < results.length; i++ ) {
      if ( results[ i ] !== null ) {
        changedRepos.push( repoSubset[ i ] );
      }
    }

    return changedRepos;
  };

  // Detect uncommitted changes in each repo:
  // https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
  // git diff-index --quiet HEAD --
  // This will error if the diff-index shows any changes in the repo, otherwise error is null.
  const changedRepos = await execOnRepos( activeRepos, 'git update-index --refresh && git diff-index --quiet HEAD --' );

  console.log( 'detected changed repos: ' + changedRepos.join( ', ' ) );

  return changedRepos;
}