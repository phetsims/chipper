// Copyright 2025, University of Colorado Boulder

import assert from 'assert';
/**
 * Throws an error if any latest production phet sims use common code string keys that do not exist in the en.json
 * of that common code repo on main.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * usage:
 * cd chipper/
 * sage run js/scripts/assertNoMissingMainEnStringKeys.ts
 */
import fs from 'fs';
import getFileAtBranch from '../../../perennial-alias/js/common/getFileAtBranch.js';
import ReleaseBranch from '../../../perennial-alias/js/common/ReleaseBranch.js';
import _ from '../../../perennial-alias/js/npm-dependencies/lodash.js';

( async () => {

  type hasEnglish = { en: object };
  const getStringMap = async ( releaseBranch: ReleaseBranch ): Promise<{ en: object }> => {

    const url = `https://phet.colorado.edu/sims/html/${releaseBranch.repo}/latest/string-map.json`;
    const x = await fetch( url );
    return x.json() as unknown as hasEnglish;
  };

  const releaseBranches = await ReleaseBranch.getAllMaintenanceBranches( false );

  // Record<fullStringKey, releaseBranchesEffected[]>
  const problemStrings: Record<string, string[]> = {};

  const populateProblem = ( stringKey: string, releaseBranch: ReleaseBranch ) => {
    problemStrings[ stringKey ] = problemStrings[ stringKey ] || [];
    problemStrings[ stringKey ].push( releaseBranch.toString() );
  };

  // Record<repoNamespace, englishStringsObjectOnMain>
  const mapOnMain: Record<string, object> = {};

  const getFromCache = ( requireJSNamespace: string ) => {
    if ( !mapOnMain.hasOwnProperty( requireJSNamespace ) ) {
      const repo = _.kebabCase( requireJSNamespace );
      mapOnMain[ requireJSNamespace ] = JSON.parse( fs.readFileSync( `../${repo}/${repo}-strings_en.json` ).toString() );
    }
    return mapOnMain[ requireJSNamespace ];
  };

  for ( const releaseBranch of releaseBranches ) {
    if ( !releaseBranch.brands.includes( 'phet' ) ) {
      continue;
    }
    console.log( releaseBranch.toString() );
    const packageJSON = JSON.parse( await getFileAtBranch( releaseBranch.repo, releaseBranch.branch, 'package.json' ) );
    const simRequireJSNamespace = packageJSON.phet.requirejsNamespace;

    let stringMap;
    try {
      stringMap = await getStringMap( releaseBranch );
    }
    catch( e ) {
      console.error( `cannot get string map for ${releaseBranch.toString()}`, e );
      continue;
    }
    if ( !stringMap.hasOwnProperty( 'en' ) ) {
      throw new Error( `no en for sim: ${releaseBranch.repo}` );
    }
    for ( const stringKey of Object.keys( stringMap.en ) ) {
      const keyParts = stringKey.split( '/' );
      const requireJSNamespace = keyParts[ 0 ];
      const actualKey = keyParts.slice( 1, keyParts.length ).join( '/' );
      if ( requireJSNamespace !== simRequireJSNamespace && !actualKey.startsWith( 'a11y' ) ) {
        const mainMap = getFromCache( requireJSNamespace );
        if ( !mainMap.hasOwnProperty( actualKey ) ) {
          populateProblem( stringKey, releaseBranch );
        }
      }
    }
  }

  assert.ok( Object.keys( problemStrings ).length === 0,
    `string keys have been deleted from main but are needed for latest published sim translations: \n${JSON.stringify( problemStrings, null, 2 )}` );
} )();