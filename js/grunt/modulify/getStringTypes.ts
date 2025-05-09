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
import { listFluentParams } from './listFluentParams.js';
import { replace } from './modulify.js';

/**
 * Converts a string key and its value to a Fluent identifier and message.
 * Based on rebuildFluentBundle in getStringModule.ts
 * @param stringKey - The key for the string
 * @param value - The value of the string
 * @returns An object with id and ftlString
 */
const convertJsonToFluent = ( stringKey: string, value: string ): { id: string; ftlString: string } => {
  // Sanitize key → valid Fluent identifier (lower‑case, letters/digits/-).
  const id = stringKey
    .replace( /^[^/]+\//, '' )   // strip namespace prefix
    .replace( /[^a-zA-Z0-9.]/g, '-' )
    .split( '.' ).join( '_' )
    .split( '-' ).join( '_' );

  const ftlString = `${id} = ${value}`;
  return { id: id, ftlString: ftlString };
};

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 */
const getStringTypes = ( repo: string ): string => {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const json = JSON.parse( readFileSync( `../${repo}/${repo}-strings_en.json`, 'utf8' ) );

  // Track paths to all the keys with values.
  const all: IntentionalAny[] = [];

  // Recursively collect all the paths to keys with values.
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

  // Build an FTL file in memory to extract parameters
  let ftlContent = '';

  // Map of string key to its fluent parameters
  const keyToParamsMap = new Map<string, string[]>();

  for ( let i = 0; i < all.length; i++ ) {
    const allElement = all[ i ];
    const joinedPath = allElement.path.join( '.' );
    const { id, ftlString } = convertJsonToFluent( joinedPath, allElement.value );
    ftlContent += ftlString + '\n';

    // Analyze the string for parameters
    try {
      const params = listFluentParams( ftlContent, id );
      if ( params.length > 0 ) {
        keyToParamsMap.set( joinedPath, params );
      }
    }
    catch( e ) {
      // If there's an error parsing, assume no parameters
      console.warn( `Error parsing fluent parameters for ${id}: ${e}` );
    }
  }

  // Transform to a new structure that matches the types we access at runtime.
  // This is the legacy structure with only StringProperties
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
          // Legacy structure only has StringProperty types
          level[ `${token}StringProperty` ] = '{{STRING_PROPERTY}}';

          // Also include the string value if supportsDynamicLocale is not true
          if ( !( packageObject.phet && packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsDynamicLocale ) ) {
            level[ token ] = '{{STRING}}';
          }
        }
        else {
          level[ token ] = level[ token ] || {};
          level = level[ token ];
        }
      }
    }
  }

  // Now create the new interface with pattern functions
  const newInterfaceLines: string[] = [];
  newInterfaceLines.push( `
// Interface for Fluent pattern strings with parameters
export const ${packageObject.phet.requirejsNamespace.toLowerCase()}StringsNewInterface = {` );

  // Add entries for each parameterized string
  keyToParamsMap.forEach( ( params, joinedPath ) => {
    const path = joinedPath.split( '.' );
    const lastKeyPart = path[ path.length - 1 ];
    const { id } = convertJsonToFluent( joinedPath, '' );

    const paramString = params.map( p => `${p}: IntentionalAny` ).join( ', ' );

    newInterfaceLines.push( `  ${lastKeyPart}: {
    format: (args: { ${paramString} }) => ${pascalCase( repo )}Strings.fluentBundleProperty.value.formatPattern(
      ${pascalCase( repo )}Strings.fluentBundleProperty.value.getMessage('${id}').value,
      args
    ),
    toProperty: (args: { ${paramString} }) => new PatternMessageProperty(
      ${pascalCase( repo )}Strings.${lastKeyPart}StringProperty,
      args
    )
  },` );
  } );

  newInterfaceLines.push( '};' );

  // Convert the structure to text
  let structureText = JSON.stringify( structure, null, 2 );

  // Use single quotes instead of the double quotes from JSON
  structureText = replace( structureText, '"', '\'' );

  structureText = replace( structureText, '\'{{STRING}}\'', 'string' );
  structureText = replace( structureText, '\'{{STRING_PROPERTY}}\'', 'LocalizedStringProperty' );

  // Add ; to the last in the list
  structureText = replace( structureText, ': string\n', ': string;\n' );
  structureText = replace( structureText, ': LocalizedStringProperty\n', ': LocalizedStringProperty;\n' );

  // Use ; instead of ,
  structureText = replace( structureText, ',', ';' );

  const result = `type StringsType = ${structureText}

${newInterfaceLines.join( '\n' )}`;

  // Function to pascal case a string (copied from pascalCase.js)
  function pascalCase( repo: string ): string {
    return repo
      .split( '-' )
      .map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
      .join( '' );
  }

  return result;
};

export default getStringTypes;