// Copyright 2026, University of Colorado Boulder

/**
 * Compare PhET-iO APIs for a repo and any phet-io-stable sim that depends on it.
 * Extracted from pre-commit-task.ts so it can be called from both the legacy pre-commit
 * path and the totality `npm run check` path.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import path from 'path';
import getRepoList from '../../../../perennial-alias/js/common/getRepoList.js';
import getPhetLibs from '../../grunt/getPhetLibs.js';
import generatePhetioMacroAPI from '../../phet-io/generatePhetioMacroAPI.js';
import phetioCompareAPISets from '../../phet-io/phetioCompareAPISets.js';
import transpile from '../transpile.js';

export default async function runPhetioApiCompare( repo: string, monorepoRoot: string ): Promise<boolean> {

  // If running git hooks in phet-io-sim-specific, it isn't worth regenerating the API for every
  // single stable sim. Rely on the hooks from the repos where the API changes come from.
  if ( repo === 'phet-io-sim-specific' ) {
    return true;
  }

  // getPhetLibs, phetioCompareAPISets, and withServer (used by generatePhetioMacroAPI) all use
  // `../` relative paths — they expect CWD to be a sim-sibling dir. Temporarily chdir to
  // <monorepo>/chipper (always present) and restore when done.
  const originalCwd = process.cwd();
  process.chdir( path.join( monorepoRoot, 'chipper' ) );
  try {
    const phetioAPIStable = getRepoList( 'phet-io-api-stable' );
    const reposToTest = phetioAPIStable.filter( ( phetioSimRepo: string ) => getPhetLibs( phetioSimRepo ).includes( repo ) );

    if ( reposToTest.length === 0 ) {
      return true;
    }

    const repos = new Set<string>();
    reposToTest.forEach( ( sim: string ) => getPhetLibs( sim ).forEach( ( lib: string ) => repos.add( lib ) ) );
    await transpile( {
      repos: Array.from( repos ),
      silent: true
    } );

    const proposedAPIs = await generatePhetioMacroAPI( reposToTest, {
      showProgressBar: reposToTest.length > 1,
      showMessagesFromSim: false
    } );

    return phetioCompareAPISets( reposToTest, proposedAPIs );
  }
  finally {
    process.chdir( originalCwd );
  }
}
