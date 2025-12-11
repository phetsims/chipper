// Copyright 2025, University of Colorado Boulder

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

import assert from 'assert';
import fs from 'fs';
import ReleaseBranch from '../../../perennial-alias/js/common/ReleaseBranch.js';
import _ from '../../../perennial-alias/js/npm-dependencies/lodash.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

( async () => {

  const getJSON = async ( url: string ): Promise<Record<string, IntentionalAny>> => {
    const x = await fetch( url );
    return x.json() as Record<string, IntentionalAny>;
  };
  const getStringMap = async ( releaseBranch: ReleaseBranch ): Promise<Record<string, IntentionalAny>> => {
    return getJSON( `https://phet.colorado.edu/sims/html/${releaseBranch.repo}/latest/english-string-map.json` );
  };
  const getPackage = async ( releaseBranch: ReleaseBranch ): Promise<Record<string, IntentionalAny>> => {
    return getJSON( `https://raw.githubusercontent.com/phetsims/${releaseBranch.repo}/refs/heads/${releaseBranch.branch}/package.json` );
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
    const packageJSON = await getPackage( releaseBranch );
    const simRequireJSNamespace = packageJSON.phet.requirejsNamespace;

    let stringMap;
    try {
      stringMap = await getStringMap( releaseBranch );
    }
    catch( e ) {
      console.error( `cannot get string map for ${releaseBranch.toString()}`, e );
      continue;
    }
    for ( const stringKey of Object.keys( stringMap ) ) {
      const keyParts = stringKey.split( '/' );
      const requireJSNamespace = keyParts[ 0 ];
      const actualKey = keyParts.slice( 1, keyParts.length ).join( '/' );
      if ( requireJSNamespace !== simRequireJSNamespace && !actualKey.startsWith( 'a11y' ) ) {
        const mainMap = getFromCache( requireJSNamespace );
        if ( !mainMap.hasOwnProperty( actualKey ) ) {
          // handle dot nesting, see https://github.com/phetsims/chipper/issues/1640
          const nestingParts = actualKey.split( '.' );
          let nestedObject: IntentionalAny = mainMap;

          for ( const part of nestingParts ) {
            if ( nestedObject ) {
              nestedObject = nestedObject[ part ];
            }
          }

          if ( !nestedObject ) {
            populateProblem( stringKey, releaseBranch );
          }
        }
      }
    }
  }

  assert.ok( Object.keys( problemStrings ).length === 0,
    `string keys have been deleted from main but are needed for latest published sim translations: \n${JSON.stringify( problemStrings, null, 2 )}` );
} )();