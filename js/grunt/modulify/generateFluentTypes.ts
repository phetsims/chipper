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
import FluentLibrary from '../../browser-and-node/FluentLibrary.js';
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

/**
 * If the string uses the legacy pattern form, it won't be compatible with Fluent.
 * If it uses double curly braces for StringUtils.fillIn, Fluent will try to find the inner term and likely fail.
 * If it uses single curly surrounding a number, it is intended for StringUtils.format.
 *
 * TODO: Can/should this be used by rosetta? It will need to know what kind of string it is for validation and maybe UX, see https://github.com/phetsims/chipper/issues/1588
 */
const isLegacyString = ( str: string ): boolean => {
  return str.includes( '{{' ) || str.includes( '}}' ) || /{\d+}/.test( str );
};

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
 * Creates an accessor string for the given path array with the specified suffix
 * e.g., for pathArr=['a', 'b.c'] and suffix='.value', returns "PascalRepoStrings.a['b']['c'].value"
 * @param pathArr - An array with the "path" to the string from nesting in the file.
 * @param suffix - The suffix to append to the end of the accessor string.
 * @param pascalCaseRepo - The PascalCase name of the repo.
 */
const createAccessor = ( pathArr: string[], suffix: string, pascalCaseRepo: string ): string => {

  // Start with the repo strings object and progressively build the property accessor chain
  return pathArr.reduce( ( acc, key ) => {

    // Handle keys with dots (e.g., "a.b" becomes separate properties ["a"]["b"])
    key.split( '.' ).forEach( part => { acc += propAccess( part ); } );
    return acc;
  }, `${pascalCaseRepo}Strings` ) + suffix;
};

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

      // A suffix for the key in the line if it is going to be a StringProperty
      const stringPropertyKey = IDENT.test( key + 'StringProperty' ) ? key + 'StringProperty' : JSON.stringify( key + 'StringProperty' );

      if ( isLegacyString( val ) ) {

        // This is a legacy string and is meant to be used with StringUtils.format or
        // StringUtils.fillIn. It should use the LocalizedStringProperty directly.
        const accessor = createAccessor( [ ...pathArr, key ], 'StringProperty', pascalCaseRepo );
        lines.push( `${indent( lvl )}${stringPropertyKey}: ${accessor}${comma}` );
      }
      else if ( cleanedSchema.length === 0 ) {

        // No parameters - use FluentConstant
        const stringPropertyKey = IDENT.test( key + 'StringProperty' ) ? key + 'StringProperty' : JSON.stringify( key + 'StringProperty' );
        lines.push( `${indent( lvl )}${stringPropertyKey}: new FluentConstant( fluentSupport.bundleProperty, '${id}' )${comma}` );
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

  // load YAML
  const yamlText = fs.readFileSync( yamlPath, 'utf8' );
  const yamlObj = yaml.load( yamlText ) as Obj;

  // collect all leaves
  const leaves = collectLeaves( yamlObj );
  const filteredLeaves = leaves.filter( leaf => !isLegacyString( leaf.value ) );

  // map fluent keys to StringProperty accessors for usage later
  const fluentKeyMapLines = filteredLeaves.map( leaf => {

    // Create an ID using underscore-separated path segments
    const id = createFluentKey( leaf.pathArr );

    // Build full path to access the Property
    const accessor = createAccessor( leaf.pathArr, 'StringProperty', pascalCaseRepo );

    return `${indent( 1 )}['${id}', ${accessor}]`;
  } ).join( ',\n' );

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
  const fluentObjectLiteral = buildFluentObject( yamlObj, keyToTypeInfoMap, pascalCaseRepo, [], 1 );

  // template TypeScript file
  const fileContents = `${copyrightLine}
// AUTOMATICALLY GENERATED – DO NOT EDIT.
// Generated from ${path.basename( yamlPath )}

/* eslint-disable */
/* @formatter:off */

import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import FluentPattern from '../../chipper/js/browser/FluentPattern.js';
import FluentContainer from '../../chipper/js/browser/FluentContainer.js';
import FluentConstant from '../../chipper/js/browser/FluentConstant.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ${camelCaseRepo} from './${camelCaseRepo}.js';
import ${pascalCaseRepo}Strings from './${pascalCaseRepo}Strings.js';

// This map is used to create the fluent file and link to all StringProperties.
// Accessing StringProperties is also critical for including them in the built sim.
const fluentKeyToStringPropertyMap = new Map( [
${fluentKeyMapLines}
] );

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