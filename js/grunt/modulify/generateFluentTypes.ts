// Copyright 2025, University of Colorado Boulder

/**
 * Parse a YAML file and convert its contents to types for Fluent.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'lodash';
import path from 'path';
import affirm from '../../../../perennial-alias/js/browser-and-node/affirm.js';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import pascalCase from '../../common/pascalCase.js';
import getCopyrightLine from '../getCopyrightLine.js';
import { getFluentParams, ParamInfo } from './getFluentParams.js';
import { fixEOL } from './modulify.js';

type Leaf = { pathArr: string[]; value: string };
type Obj = Record<string, IntentionalAny>;

/** true if key is a valid JS identifier (no quoting needed). */
const IDENT = /^[A-Za-z_$][\w$]*$/;

/** JS property accessor for {{Repo}}Strings keys (dot or bracket). */
const propAccess = ( key: string ): string => ( IDENT.test( key ) ? `.${key}` : `[${JSON.stringify( key )}]` );

/** Indent helper. */
const indent = ( lvl: number, spaces = 2 ): string => ' '.repeat( lvl * spaces );

/** Recursively walk object, returning leaf records. */
function collectLeaves( obj: Obj, pathArr: string[] = [] ): Leaf[] {
  const leaves: Leaf[] = [];
  for ( const [ key, val ] of Object.entries( obj ) ) {
    if ( val !== null && typeof val === 'object' && !Array.isArray( val ) ) {
      leaves.push( ...collectLeaves( val, [ ...pathArr, key ] ) );
    }
    else {
      leaves.push( { pathArr: [ ...pathArr, key ], value: val } ); // scalar leaf
    }
  }
  return leaves;
}

// Create a key for the fluent contents, nesting is indicated by underscores for valid fluent syntax.
function createFluentKey( pathArr: string[] ): string {
  return pathArr.join( '_' );
}

/** Build nested TS literal from YAML, inserting both helpers at leaves. */
function buildFluentObject( obj: Obj, typeInfoMap: Map<string, ParamInfo[]>, pascalCaseRepo: string, pathArr: string[] = [], lvl = 1 ): string {
  const lines = [ '{' ];
  const entries = Object.entries( obj );
  entries.forEach( ( [ key, val ], idx ) => {
    const safeKey = IDENT.test( key ) ? key : JSON.stringify( key ); // TODO: is stringify appropriate here? https://github.com/phetsims/chipper/issues/1588
    const comma = idx < entries.length - 1 ? ',' : '';
    if ( val !== null && typeof val === 'object' && !Array.isArray( val ) ) {
      // recurse
      const sub = buildFluentObject( val, typeInfoMap, pascalCaseRepo, [ ...pathArr, key ], lvl + 1 );
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

        // The schema may have a __hasReferences property which should not be in the final type definition.
        // TODO: Can this property be removed? See https://github.com/phetsims/chipper/issues/1588
        const cleanedSchema = schema.filter( prop => prop.name !== '__hasReferences' );

        const properties = cleanedSchema.map( prop => {
          const name = prop.name;
          let typeString;

          if ( prop.variants && Array.isArray( prop.variants ) && prop.variants.length > 0 ) {
            // Create the union of string literals
            const variantLiterals = prop.variants.map( v => `'${v}'` ).join( ' | ' );
            // Create the full type string including TReadOnlyProperty
            typeString = `${variantLiterals} | TReadOnlyProperty<${variantLiterals}>`;
          }
          else {
            // Default to IntentionalAny if no variants are provided
            typeString = 'IntentionalAny';
          }
          return `${name}: ${typeString}`;
        } );

        return `{ ${properties.join( ', ' )} }`;
      }

      // Check if there are no parameters (empty cleaned schema)
      // TODO: Eliminate __hasReferences since it is never consulted. See https://github.com/phetsims/chipper/issues/1588
      const cleanedSchema = paramInfo.filter( prop => prop.name !== '__hasReferences' );

      if ( cleanedSchema.length === 0 ) {

        // No parameters - use direct StringProperty access
        // TODO: call createAccessor here See https://github.com/phetsims/chipper/issues/1588
        const stringPropertyPath = [ ...pathArr, key ];
        const accessor = stringPropertyPath.reduce( ( acc, k ) => {
          k.split( '.' ).forEach( part => { acc += propAccess( part ); } );
          return acc;
        }, `${pascalCaseRepo}Strings` ) + 'StringProperty';

        // Add "StringProperty" suffix to the key name for no-parameter strings
        const stringPropertyKey = IDENT.test( key + 'StringProperty' ) ? key + 'StringProperty' : JSON.stringify( key + 'StringProperty' );
        lines.push( `${indent( lvl )}${stringPropertyKey}: ${accessor}${comma}` );
      }
      else {
        // Has parameters - use FluentPattern
        const T = ( generateTypeDefinition( paramInfo ) );
        lines.push( `${indent( lvl )}${safeKey}: new FluentPattern<${T}>( fluentSupport.bundleProperty, '${id}' )${comma}` );
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

  // 1 load YAML
  const yamlText = fs.readFileSync( yamlPath, 'utf8' );
  const yamlObj = yaml.load( yamlText ) as Obj;

  // 2 collect all leaves
  const leaves = collectLeaves( yamlObj );

  /**
   * Creates an accessor string for the given path array with the specified suffix
   * e.g., for pathArr=['a', 'b.c'] and suffix='.value', returns "PascalRepoStrings.a['b']['c'].value"
   */
  const createAccessor = ( pathArr: string[], suffix: string ): string => {

    // Start with the repo strings object and progressively build the property accessor chain
    return pathArr.reduce( ( acc, key ) => {

      // Handle keys with dots (e.g., "a.b" becomes separate properties ["a"]["b"])
      key.split( '.' ).forEach( part => { acc += propAccess( part ); } );
      return acc;
    }, `${pascalCaseRepo}Strings` ) + suffix;
  };

  // 3 FTL snippet - create Fluent Translation List entries for each string
  const ftlLines = leaves.map( ( { pathArr } ) => {

    // Create an ID using underscore-separated path segments
    const id = createFluentKey( pathArr );

    // Build full property path to access the string value
    const accessor = createAccessor( pathArr, 'StringProperty.value' );

    // Format as "id = ${SimStrings.path.to.StringProperty.value}"
    return `${id} = \${${accessor}}`;
  } ).join( '\n' );

  // Generate array of all StringProperty accessors for monitoring changes
  const stringLines = leaves.map( ( { pathArr } ) => createAccessor( pathArr, 'StringProperty' ) );

  const copyrightLine = await getCopyrightLine( repo, outPath );

  let ftlContent = '';
  leaves.forEach( ( { pathArr, value } ) => {
    const key = createFluentKey( pathArr );
    const ftlString = `${key} = ${value}`;
    ftlContent += ftlString + '\n';
  } );

  const keyToTypeInfoMap = new Map<string, ParamInfo[]>();

  leaves.forEach( ( { pathArr } ) => {
    const fluentKey = createFluentKey( pathArr );
    keyToTypeInfoMap.set( fluentKey, getFluentParams( ftlContent, fluentKey ) );
  } );

  // 4 Fluent object literal
  const fluentObjectLiteral = buildFluentObject( yamlObj, keyToTypeInfoMap, pascalCaseRepo, [], 1 );

  // 5 Template TypeScript file
  const fileContents = `${copyrightLine}
// AUTOMATICALLY GENERATED – DO NOT EDIT.
// Generated from ${path.basename( yamlPath )}

/* eslint-disable */
/* @formatter:off */

import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import FluentPattern from '../../chipper/js/browser/FluentPattern.js';
import FluentContainer from '../../chipper/js/browser/FluentContainer.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ${camelCaseRepo} from './${camelCaseRepo}.js';
import ${pascalCaseRepo}Strings from './${pascalCaseRepo}Strings.js';

const getFTL = (): string => {
  const ftl = \`
${ftlLines}
\`;
  return ftl;
};

const allStringProperties = [
  ${stringLines.join( ',\n' )}
];

const fluentSupport = new FluentContainer( getFTL, allStringProperties );

const ${pascalCaseRepo}Fluent = ${fluentObjectLiteral};

export default ${pascalCaseRepo}Fluent;

${camelCaseRepo}.register('${pascalCaseRepo}Fluent', ${pascalCaseRepo}Fluent);
`;

// 6 write out
  await writeFileAndGitAdd( repo, outPath, fixEOL( fileContents ) );
  console.log( `✅  Wrote ${outPath} with ${leaves.length} messages.` );
};

export default generateFluentTypes;