// Copyright 2025, University of Colorado Boulder

/**
 * Parse a YAML file and convert its contents to types for Fluent.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import affirm from '../../../../perennial-alias/js/browser-and-node/affirm.js';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import FluentLibrary from '../../browser-and-node/FluentLibrary.js';
import ChipperStringUtils from '../../common/ChipperStringUtils.js';
import pascalCase from '../../common/pascalCase.js';
import getCopyrightLine from '../getCopyrightLine.js';
import { safeLoadYaml } from './convertStringsYamlToJson.js';
import { getFluentParams, NUMBER_LITERAL, ParamInfo } from './getFluentParams.js';
import { fixEOL } from './modulify.js';

type Leaf = { pathArr: string[]; value: string };
type Obj = Record<string, IntentionalAny>;

/** true if key is a valid JS identifier (no quoting needed). */
const IDENT = /^[A-Za-z_$][\w$]*$/;

/** Indent helper. */
const indent = ( lvl: number, spaces = 2 ): string => ' '.repeat( lvl * spaces );

type FluentComment = IntentionalAny;

/**
 * Parse comments from raw YAML text while preserving order.
 * Returns an array of FluentComment objects with line numbers and associated keys.
 */
function parseYamlComments( yamlText: string ): FluentComment[] {
  const lines = yamlText.split( '\n' );
  const comments: FluentComment[] = [];

  for ( let i = 0; i < lines.length; i++ ) {
    const line = lines[ i ].trim();

    // Check if line is a comment (starts with #)
    if ( line.startsWith( '#' ) ) {
      const comment = line.substring( 1 ).trim(); // Remove # and trim whitespace

      // Look ahead to find the next non-comment, non-empty line to associate with
      let associatedKey: string | undefined;
      for ( let j = i + 1; j < lines.length; j++ ) {
        const nextLine = lines[ j ].trim();
        if ( nextLine && !nextLine.startsWith( '#' ) ) {
          // Extract the key from "key: value" format
          const colonIndex = nextLine.indexOf( ':' );
          if ( colonIndex > 0 ) {
            associatedKey = nextLine.substring( 0, colonIndex ).trim();
          }
          break;
        }
      }

      comments.push( {
        comment: comment,
        associatedKey: associatedKey
      } );
    }
  }

  return comments;
}

/** Recursively walk object, returning leaf records. */
function collectLeaves( obj: Obj, pathArr: string[] = [] ): Leaf[] {
  const leaves: Leaf[] = [];
  for ( const [ key, val ] of Object.entries( obj ) ) {
    if ( val !== null && typeof val === 'object' && !Array.isArray( val ) ) {
      leaves.push( ...collectLeaves( val, [ ...pathArr, key ] ) );
    }
    else {

      // Replace fluent references with dot separated values (which is not valid in Fluent syntax) with
      // underscores. This allows PhET developers to use dot notation when referencing fluent keys,
      // which is more familiar.
      const replacedString = ChipperStringUtils.replaceFluentReferences( val );
      leaves.push( { pathArr: [ ...pathArr, key ], value: replacedString } ); // scalar leaf
    }
  }
  return leaves;
}

/**
 * Create a key for the fluent file from the path array. Nesting from the YAML is indicated by underscores.
 * Characters that are not valid in Fluent keys are replaced with dashes.
 */
function createFluentKey( pathArr: string[] ): string {

  return pathArr
    .join( '_' )

    // This regex matches any character that is not a letter, digit, or underscore.
    .replace( /[^a-zA-Z0-9]/g, '_' );
}

/**
 * Creates an accessor path for a StringProperty for the given path array.
 *
 * e.g., for pathArr=['a', 'b.c'], returns "a.b.cStringProperty".
 *
 * @param pathArr - An array with the "path" to the string from nesting in the file.
 */
const createAccessor = ( pathArr: string[] ): string => {

  affirm( pathArr.length > 0, 'pathArr must contain at least one key' );

  // Clone the array and glue the suffix onto its last element
  const parts = pathArr.slice();
  const lastIdx = parts.length - 1;
  parts[ lastIdx ] = parts[ lastIdx ] + 'StringProperty'; // strip leading dot if given

  // .get is graceful which is nice because strings are removed from the build if they are not used.
  return parts.join( '.' );
};

/**
 * Expands “dot-notation” keys into real nested objects.
 *
 * If the key contains one or more dots (e.g. `"a.b.c"`), the key is split on the dot
 * characters and intermediate objects are created so that the value resides
 * at the correct depth:
 *
 *   expandDottedKeys({ "a.b": 1, "x.y.z": 2 })
 *   // { a: { b: 1 }, x: { y: { z: 2 } } }
 *
 * Keys without dots are copied verbatim.
 *
 * If several keys share a common prefix, the resulting sub-objects are merged;
 * when the same final path is encountered more than once, the later value
 * overwrites the earlier one.
 */
function expandDottedKeys( object: Record<string, unknown> ): Record<string, unknown> {
  const newObject: Record<string, unknown> = {};

  Object.entries( object ).forEach( ( [ rawKey, value ] ) => {
    const parts = rawKey.split( '.' );

    // The 'cursor' is the position where we are in the tree as we recursively build the object.
    let cursor: Record<string, unknown> = newObject;

    for ( let i = 0; i < parts.length - 1; i++ ) {
      const part = parts[ i ];

      // We have never seen this key before, so we need to create an object for it.
      // If we HAVE seen it, we will use the existing object and merge into it.
      if ( cursor[ part ] === undefined || cursor[ part ] === null ) {
        cursor[ part ] = {};
      }
      cursor = cursor[ part ] as Record<string, unknown>;
    }

    const last = parts[ parts.length - 1 ];

    let nextEntry;
    if ( value && typeof value === 'object' && !Array.isArray( value ) ) {
      // If the value is an object, we recursively expand its keys as well.
      nextEntry = expandDottedKeys( value as Record<string, unknown> );
    }
    else {
      nextEntry = value;
    }

    // Set the final value in the cursor object.
    cursor[ last ] = nextEntry;

    cursor[ last ] =
      ( value && typeof value === 'object' && !Array.isArray( value ) ) ? expandDottedKeys( value as Record<string, unknown> )
                                                                        : value;
  } );

  return newObject;
}

/** Build nested TS literal from YAML, inserting both helpers at leaves and interleaving comments. */
function buildFluentObject( obj: Obj, typeInfoMap: Map<string, ParamInfo[]>, pascalCaseRepo: string, comments: FluentComment[] = [], pathArr: string[] = [], lvl = 1 ): string {

  // Keys with dots should be expanded into nested objects so that usages can easily access values with
  // dot notation.
  obj = expandDottedKeys( obj );

  const lines = [ '{' ];
  const entries = Object.entries( obj );

  // Helper to get the full key path for a given key at current level
  const getFullPath = ( key: string ) => [ ...pathArr, key ].join( '.' );

  // Find comments that should be placed at this level
  const levelComments = comments.filter( comment => {
    if ( !comment.associatedKey ) {
      return false;
    }

    // Check if this comment's associated key matches any key at this level
    const associatedKeyPath = comment.associatedKey;
    return entries.some( ( [ key ] ) => {
      const fullPath = getFullPath( key );
      return associatedKeyPath === key || associatedKeyPath === fullPath;
    } );
  } );

  // Group comments by their associated keys
  const commentsByKey = new Map<string, FluentComment[]>();
  levelComments.forEach( comment => {
    if ( comment.associatedKey ) {
      // Find the entry key that matches this comment
      const matchingKey = entries.find( ( [ key ] ) => {
        const fullPath = getFullPath( key );
        return comment.associatedKey === key || comment.associatedKey === fullPath;
      } )?.[ 0 ];

      if ( matchingKey ) {
        if ( !commentsByKey.has( matchingKey ) ) {
          commentsByKey.set( matchingKey, [] );
        }
        commentsByKey.get( matchingKey )!.push( comment );
      }
    }
  } );

  let commentCounter = 0;

  entries.forEach( ( [ key, val ], idx ) => {
    // Add comments before this key if any exist
    const keyComments = commentsByKey.get( key );
    if ( keyComments ) {
      keyComments.forEach( comment => {
        const commentKey = `_comment_${commentCounter}`;
        const commentData = JSON.stringify( comment );
        // Comments always need a comma since they're followed by either another comment or the actual key
        lines.push( `${indent( lvl )}${commentKey}: new FluentComment( ${commentData} ),` );
        commentCounter++;
      } );
    }

    // If the key is not a valid JS identifier, we need to quote it. This can be accomplished by using JSON.stringify.
    const safeKey = IDENT.test( key ) ? key : JSON.stringify( key );
    const comma = idx < entries.length - 1 ? ',' : '';
    if ( val !== null && typeof val === 'object' && !Array.isArray( val ) ) {
      // recurse
      const sub = buildFluentObject( val, typeInfoMap, pascalCaseRepo, comments, [ ...pathArr, key ], lvl + 1 );
      lines.push( `${indent( lvl )}${safeKey}: ${sub}${comma}` );
    }
    else {
      // leaf
      const id = createFluentKey( [ ...pathArr, key ] );

      const paramInfo = typeInfoMap.get( id );
      affirm( paramInfo, `Missing type info for ${id}` );

      // Convert param info from the fluent value into a TypeScript type for development.
      function generateTypeDefinition( schema: ParamInfo[] ): string {

        if ( !Array.isArray( schema ) ) {
          console.error( 'Input must be an array of property definitions.' );
          return '{}';
        }

        const properties = schema.map( prop => {
          const name = prop.name;
          let typeString;

          if ( prop.variants && Array.isArray( prop.variants ) && prop.variants.length > 0 ) {
            // Create the union of string literals
            const variantLiterals = prop.variants.map( v => {

              if ( typeof v === 'number' ) {

                // If the variant is a number, return it as is, so it will appear in the type like a number literal
                return v;
              }
              else if ( typeof v === 'string' ) {
                return `'${v}'`;
              }
              else {

                affirm( v.type === NUMBER_LITERAL, 'Unexpected variant type, expected string or number literal' );

                return `number | '${v.value}'`;

              }
            } ).join( ' | ' );
            // Create the full type string including TReadOnlyProperty
            typeString = `${variantLiterals} | TReadOnlyProperty<${variantLiterals}>`;
          }
          else {

            // If no variants are provided, this will be a string, number, or TReadOnlyProperty of those types.
            typeString = 'FluentVariable';
          }
          return `${name}: ${typeString}`;
        } );

        return `{ ${properties.join( ', ' )} }`;
      }

      // Check if there are no parameters (empty cleaned schema)

      // A suffix for the key in the line if it is going to be a StringProperty
      const stringPropertyKey = IDENT.test( key + 'StringProperty' ) ? key + 'StringProperty' : JSON.stringify( key + 'StringProperty' );

      const accessor = createAccessor( [ ...pathArr, key ] );
      const getter = `_.get( ${pascalCaseRepo}Strings, '${accessor}' )`;
      if ( ChipperStringUtils.isLegacyStringPattern( val ) ) {

        // This is a legacy string and is meant to be used with StringUtils.format or
        // StringUtils.fillIn. It should use the LocalizedStringProperty directly.
        lines.push( `${indent( lvl )}${stringPropertyKey}: ${getter}${comma}` );
      }
      else if ( paramInfo.length === 0 ) {

        // No parameters - use FluentConstant
        const stringPropertyKey = IDENT.test( key + 'StringProperty' ) ? key + 'StringProperty' : JSON.stringify( key + 'StringProperty' );
        lines.push( `${indent( lvl )}${stringPropertyKey}: new FluentConstant( fluentSupport.bundleProperty, '${id}', ${getter} )${comma}` );
      }
      else {

        // Has parameters - use FluentPattern
        const T = generateTypeDefinition( paramInfo );
        lines.push( `${indent( lvl )}${safeKey}: new FluentPattern<${T}>( fluentSupport.bundleProperty, '${id}', ${getter}, ${JSON.stringify( paramInfo )} )${comma}` );
      }
    }
  } );
  lines.push( `${indent( lvl - 1 )}}` );
  return lines.join( '\n' );
}

/** Build nested TS literal from YAML, inserting both helpers at leaves. */
const generateFluentTypes = async ( repo: string ): Promise<void> => {
  const pascalCaseRepo = pascalCase( repo );
  const camelCaseRepo = _.camelCase( repo );

  const yamlPath = `../${repo}/${repo}-strings_en.yaml`;
  const outPath = `js/${pascalCaseRepo}Fluent.ts`;

  // load YAML
  const yamlText = fs.readFileSync( yamlPath, 'utf8' );
  const yamlObj = safeLoadYaml( yamlText ) as Obj;

  // Parse comments from the YAML text
  const comments = parseYamlComments( yamlText );

  // collect all leaves
  const leaves = collectLeaves( yamlObj );

  // Make sure that there are no key collisions in the fluent keys. Dots and nesting
  // are all converted to underscores.
  const allKeys = leaves.map( leaf => createFluentKey( leaf.pathArr ) );
  allKeys.forEach( key => {
    const count = allKeys.filter( k => k === key ).length;
    affirm( count === 1, `Duplicate key found in YAML: ${key} appears ${count} times` );
  } );

  const filteredLeaves = leaves.filter( leaf => !ChipperStringUtils.isLegacyStringPattern( leaf.value ) );

  // map fluent keys to StringProperty accessors for usage later
  const fluentKeyMapLines = filteredLeaves.map( leaf => {

    // Create an ID using underscore-separated path segments
    const id = createFluentKey( leaf.pathArr );

    // Build full path to access the Property
    const accessor = createAccessor( leaf.pathArr );

    return `addToMapIfDefined( '${id}', '${accessor}' );`;
  } ).join( '\n' );

  const copyrightLine = await getCopyrightLine( repo, outPath );

  // create FTL file contents from the english entries in the YAML so that we can create TypeScript types
  // and verify the syntax.
  const ftlContent = filteredLeaves.map( leaf => {
    const id = createFluentKey( leaf.pathArr );
    return `${id} = ${leaf.value}`;
  } ).join( '\n' );


  // verify the fluent file to report syntax errors in the english content.
  FluentLibrary.verifyFluentFile( ftlContent );

  const keyToTypeInfoMap = new Map<string, ParamInfo[]>();
  leaves.forEach( ( { pathArr } ) => {
    const fluentKey = createFluentKey( pathArr );
    keyToTypeInfoMap.set( fluentKey, getFluentParams( ftlContent, fluentKey ) );
  } );

  // an object literal that will be used to create the Fluent typescript object
  const fluentObjectLiteral = buildFluentObject( yamlObj, keyToTypeInfoMap, pascalCaseRepo, comments, [], 1 );

  // template TypeScript file
  const fileContents = `${copyrightLine}
// AUTOMATICALLY GENERATED – DO NOT EDIT.
// Generated from ${path.basename( yamlPath )}

/* eslint-disable */
/* @formatter:off */

import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import type { FluentVariable } from '../../chipper/js/browser/FluentPattern.js';
import FluentPattern from '../../chipper/js/browser/FluentPattern.js';
import FluentContainer from '../../chipper/js/browser/FluentContainer.js';
import FluentConstant from '../../chipper/js/browser/FluentConstant.js';
import FluentComment from '../../chipper/js/browser/FluentComment.js';
import ${camelCaseRepo} from './${camelCaseRepo}.js';
import ${pascalCaseRepo}Strings from './${pascalCaseRepo}Strings.js';

// This map is used to create the fluent file and link to all StringProperties.
// Accessing StringProperties is also critical for including them in the built sim.
// However, if strings are unused in Fluent system too, they will be fully excluded from
// the build. So we need to only add actually used strings.
const fluentKeyToStringPropertyMap = new Map();

const addToMapIfDefined = ( key: string, path: string ) => {
  const sp = _.get( ${pascalCaseRepo}Strings, path );
  if ( sp ) {
    fluentKeyToStringPropertyMap.set( key, sp );
  }
};

${fluentKeyMapLines}

// A function that creates contents for a new Fluent file, which will be needed if any string changes.
const createFluentFile = (): string => {
  let ftl = '';
  for (const [key, stringProperty] of fluentKeyToStringPropertyMap.entries()) {
    ftl += \`\${key} = \${stringProperty.value}\\n\`;
  }
  return ftl;
};

const fluentSupport = new FluentContainer( createFluentFile, Array.from(fluentKeyToStringPropertyMap.values()) );

const ${pascalCaseRepo}Fluent = ${fluentObjectLiteral};

export default ${pascalCaseRepo}Fluent;

${camelCaseRepo}.register('${pascalCaseRepo}Fluent', ${pascalCaseRepo}Fluent);
`;

// 6 write out
  await writeFileAndGitAdd( repo, outPath, fixEOL( fileContents ) );
  console.log( `✅  Wrote ${outPath} with ${leaves.length} messages.` );
};

export default generateFluentTypes;