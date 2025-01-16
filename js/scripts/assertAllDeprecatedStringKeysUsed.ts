// Copyright 2025, University of Colorado Boulder

/**
 * Throws an error if the codebase has any deprecated strings found in `repo-en.json` string files that aren't used
 * by any PhET production simulations.
 *
 * To test the assertion is working, build a smaller subset of releaseBranches for
 * publishedMap (using releaseBranches.slice(100) in the loop)
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * usage:
 * cd chipper/
 * sage run js/scripts/assertAllDeprecatedStringKeysUsed.ts
 */

import assert from 'assert';
import fs from 'fs';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos.js';
import loadJSON from '../../../perennial-alias/js/common/loadJSON.js';
import ReleaseBranch from '../../../perennial-alias/js/common/ReleaseBranch.js';

( async () => {

  const getPublishedStringMap = async ( releaseBranch: ReleaseBranch ): Promise<object> => {
    const url = `https://phet.colorado.edu/sims/html/${releaseBranch.repo}/latest/english-string-map.json`;
    const x = await fetch( url );
    return x.json() as object;
  };

  const getLocalStringMap = ( repo: string ) => {
    let file = null;
    try {
      file = fs.readFileSync( `../${repo}/${repo}-strings_en.json` );
    }
    catch( e ) {
      return null;
    }
    return JSON.parse( file.toString() );
  };

  const publishedMap: object[] = [];

  const localKeyUsedInAnyPublishedSim = ( fullStringKey: string ) => {
    for ( const publishedStringMap of publishedMap ) {
      if ( publishedStringMap.hasOwnProperty( fullStringKey ) ) {
        return true;
      }
    }
    return false;
  };

  const releaseBranches = await ReleaseBranch.getAllMaintenanceBranches( false );
  for ( const releaseBranch of releaseBranches ) {
    if ( releaseBranch.brands.includes( 'phet' ) ) {
      publishedMap.push( await getPublishedStringMap( releaseBranch ) );
    }
  }
  const problemStrings: string[] = [];

  for ( const repo of getActiveRepos() ) {
    const localMap = getLocalStringMap( repo );
    if ( !localMap ) {
      continue;
    }
    const packageJSON = await loadJSON( `../${repo}/package.json` );
    const requireJSNamespace = packageJSON.phet.requirejsNamespace;

    for ( const localMapKey in localMap ) {
      if ( localMap[ localMapKey ].deprecated ) {
        const fullStringKey = `${requireJSNamespace}/${localMapKey}`;
        const used = localKeyUsedInAnyPublishedSim( fullStringKey );
        if ( !used ) {
          problemStrings.push( fullStringKey );
        }
      }
    }
  }

  assert.ok( problemStrings.length === 0,
    `unused deprecated strings exist on main. let's remove them: \n${problemStrings.join( ',\n' )}\n` );
} )();