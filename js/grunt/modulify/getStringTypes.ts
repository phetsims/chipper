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
import FluentLibrary from '../../browser-and-node/FluentLibrary.js';
import { getFluentParams, ParamInfo } from './getFluentParams.js';
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
const getStringTypes = ( repo: string, fluentExportName: string ): string => {
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
  const idToPathMap = new Map<string, string>();
  const allFluentStrings: Array<{ id: string; joinedPath: string }> = [];

  // First loop: Build the complete FTL content, so that subsequent variables can be referenced by a term that *precedes* them
  for ( const allElement of all ) {
    const joinedPath = allElement.path.join( '.' );
    const { id, ftlString } = convertJsonToFluent( joinedPath, allElement.value );
    ftlContent += ftlString + '\n';
    idToPathMap.set( id, joinedPath );
    allFluentStrings.push( { id: id, joinedPath: joinedPath } );
  }

  // Verify the fluent file.
  FluentLibrary.verifyFluentFile( ftlContent );

  // Map of string key to its fluent parameters with variant information
  const keyToParamsMap = new Map<string, ParamInfo[]>();

  // Second loop: Extract parameters for each string using the complete FTL file
  for ( const { id, joinedPath } of allFluentStrings ) {
    try {
      const params = getFluentParams( ftlContent, id );
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

  // localizedStringMap: Record<string, LocalizedString>;
  structure.localizedStringMap = '{{LOCALIZED_STRING_MAP_RECORD}}';
  structure.fluentBundleProperty = '{{FLUENT_BUNDLE_PROPERTY}}';

  // Now create the new interface with all strings, matching the nested structure of StringsType
  const newInterfaceStructure: IntentionalAny = {};

  // Build the same structure as the original StringsType
  for ( const allElement of all ) {
    const path = allElement.path;
    let level = newInterfaceStructure;

    // Create nested structure
    for ( let k = 0; k < path.length - 1; k++ ) {
      const token = path[ k ];
      level[ token ] = level[ token ] || {};
      level = level[ token ];
    }

    // Get the leaf token (last part of path)
    const lastKeyPart = path[ path.length - 1 ];
    const joinedPath = path.join( '.' );

    if ( keyToParamsMap.has( joinedPath ) ) {
      // For parameterized strings, add the format/toProperty interface
      const params = keyToParamsMap.get( joinedPath )!;
      const { id } = convertJsonToFluent( joinedPath, '' );

      // Generate type information for each parameter
      const paramTypesArray = params.map( param => {
        // Skip the special __hasReferences parameter which is just a marker
        if ( param.name === '__hasReferences' ) {
          return null;
        }
        else if ( param.variants && param.variants.length > 0 ) {
          // For select expression parameters, generate a union type of the variants
          // Filter out '*' which represents the 'other' case
          const variantOptions = param.variants
            .filter( v => v !== '*' )
            .map( v => `'${v}'` )
            .join( ' | ' );

          // Return both the direct union type and the TReadOnlyProperty wrapped version
          return `${param.name}: ${variantOptions} | TReadOnlyProperty<${variantOptions}>`;
        }
        else {
          // For simple parameters, use IntentionalAny
          return `${param.name}: IntentionalAny`;
        }
      } ).filter( param => param !== null );

      const paramString = paramTypesArray.join( ', ' );

      // Check if this is a message with only references (no real parameters)
      const isReferenceOnlyMessage = params.length === 1 && params[ 0 ].name === '__hasReferences';

      level[ lastKeyPart ] = {
        __formatToProperty: {
          paramString: paramString,
          id: id,
          fullKey: `${packageObject.phet.requirejsNamespace}/${joinedPath}`,
          isReferenceOnlyMessage: isReferenceOnlyMessage
        }
      };
    }
    else {
      // For non-parameterized strings, reference the StringProperty directly
      level[ lastKeyPart ] = {
        __direct: true,
        fullKey: `${packageObject.phet.requirejsNamespace}/${joinedPath}`
      };
    }
  }

  // Convert the structure to JavaScript code
  const generateInterfaceCode = ( structure: IntentionalAny, path: string[] = [], indent = '' ) => {
    const lines: string[] = [];

    // Start with opening brace
    if ( path.length === 0 ) {
      lines.push( `
// Interface for all strings, with special handling for parameterized patterns
export const ${fluentExportName} = {` );
    }
    else {
      lines.push( `${indent}{` );
    }

    // Generate code for each key
    Object.keys( structure ).forEach( ( key, index, array ) => {
      const value = structure[ key ];
      const isLast = index === array.length - 1;
      const comma = isLast ? '' : ',';

      if ( value.__formatToProperty ) {
        // For parameterized strings
        const { paramString, id, isReferenceOnlyMessage } = value.__formatToProperty;

        if ( isReferenceOnlyMessage ) {
          // For strings with only message references but no variables
          lines.push( `${indent}  '${key}': createFluentMessageProperty( ${pascalCase( repo )}Strings.fluentBundleProperty, '${id}' )${comma}` );
        }
        else {
          // For regular parameterized strings
          lines.push( `${indent}  '${key}': {
${indent}    format: (args: { ${paramString} }) => FluentUtils.formatMessageWithBundle(
${indent}      ${pascalCase( repo )}Strings.fluentBundleProperty.value.getMessage('${id}')!.value!,
${indent}      ${pascalCase( repo )}Strings.fluentBundleProperty.value,
${indent}      args
${indent}    ),
${indent}    createProperty: (args: { ${paramString} }) => createFluentMessageProperty( ${pascalCase( repo )}Strings.fluentBundleProperty, '${id}', args )
${indent}  }${comma}` );
        }
      }
      else if ( value.__direct ) {
        // For non-parameterized strings, reference the StringProperty directly from localizedStringMap
        lines.push( `${indent}  '${key}': ${pascalCase( repo )}Strings.localizedStringMap['${value.fullKey}'].property${comma}` );
      }
      else {
        // For nested objects
        const nestedLines = generateInterfaceCode( value, [ ...path, key ], indent + '  ' );
        lines.push( `${indent}  '${key}': ${nestedLines}${comma}` );
      }
    } );

    // End with closing brace
    if ( path.length === 0 ) {
      lines.push( '};' );
    }
    else {
      lines.push( `${indent}}` );
    }

    return path.length === 0 ? lines.join( '\n' ) : lines.join( '\n' );
  };

  const newInterfaceLines = [ generateInterfaceCode( newInterfaceStructure ) ];

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

  // These types need to use commas and not semicolons
  structureText = replace( structureText, '\'{{LOCALIZED_STRING_MAP_RECORD}}\'', 'Record<string, LocalizedString>' );
  structureText = replace( structureText, '\'{{FLUENT_BUNDLE_PROPERTY}}\'', 'TReadOnlyProperty<FluentBundle>;' );

  const result = `type StringsType = ${structureText}

const ${pascalCase( repo )}Strings = getStringModule( '${packageObject.phet.requirejsNamespace}' ) as StringsType;

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