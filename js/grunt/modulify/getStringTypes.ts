// Copyright 2020-2025, University of Colorado Boulder

/**
 * Create the TypeScript-compatible type declarations for a string file.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import { replace } from './modulify.js';

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 */
const getStringTypes = ( repo: string ): string => {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const json = JSON.parse( readFileSync( `../${repo}/${repo}-strings_en.json`, 'utf8' ) );

  // Track paths to all the keys with values.
  const all: IntentionalAny[] = [];

  // Recursively collect all of the paths to keys with values.
  const visit = ( level: IntentionalAny, path: string[] ) => {
    Object.keys( level ).forEach( key => {
      if ( key !== '_comment' ) {
        if ( level[ key ].value && typeof level[ key ].value === 'string' ) {

          // Deprecated means that it is used by release branches, but shouldn't be used in new code, so keep it out of the type.
          if ( !level[ key ].deprecated ) {
            all.push( { path: [ ...path, key ], value: level[ key ].value } );
          }
        }
        else {
          visit( level[ key ], [ ...path, key ] );
        }
      }
    } );
  };
  visit( json, [] );

  // Transform to a new structure that matches the types we access at runtime.
  const structure: IntentionalAny = {};
  for ( let i = 0; i < all.length; i++ ) {
    const allElement = all[ i ];
    const path = allElement.path;
    let level = structure;
    for ( let k = 0; k < path.length; k++ ) {
      const pathElement = path[ k ];
      const tokens = pathElement.split( '.' );
      for ( let m = 0; m < tokens.length; m++ ) {
        const token = tokens[ m ];

        assert( !token.includes( ';' ), `Token ${token} cannot include forbidden characters` );
        assert( !token.includes( ',' ), `Token ${token} cannot include forbidden characters` );
        assert( !token.includes( ' ' ), `Token ${token} cannot include forbidden characters` );

        if ( k === path.length - 1 && m === tokens.length - 1 ) {
          if ( !( packageObject.phet && packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsDynamicLocale ) ) {
            level[ token ] = '{{STRING}}'; // instead of value = allElement.value
          }
          level[ `${token}StringProperty` ] = '{{STRING_PROPERTY}}';
        }
        else {
          level[ token ] = level[ token ] || {};
          level = level[ token ];
        }
      }
    }
  }

  let text = JSON.stringify( structure, null, 2 );

  // Use single quotes instead of the double quotes from JSON
  text = replace( text, '"', '\'' );

  text = replace( text, '\'{{STRING}}\'', 'string' );
  text = replace( text, '\'{{STRING_PROPERTY}}\'', 'LocalizedStringProperty' );

  // Add ; to the last in the list
  text = replace( text, ': string\n', ': string;\n' );
  text = replace( text, ': LocalizedStringProperty\n', ': LocalizedStringProperty;\n' );

  // Use ; instead of ,
  text = replace( text, ',', ';' );

  return text;
};

export default getStringTypes;