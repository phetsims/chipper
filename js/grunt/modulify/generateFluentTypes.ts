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
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import pascalCase from '../../common/pascalCase.js';
import getCopyrightLine from '../getCopyrightLine.js';
import { fixEOL } from './modulify.js';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';

type Leaf = { pathArr: string[] };
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
      leaves.push( { pathArr: [ ...pathArr, key ] } ); // scalar leaf
    }
  }
  return leaves;
}

/** Build nested TS literal from YAML, inserting both helpers at leaves. */
function buildFluentObject( obj: Obj, pathArr: string[] = [], lvl = 1 ): string {
  const lines = [ '{' ];
  const entries = Object.entries( obj );
  entries.forEach( ( [ key, val ], idx ) => {
    const safeKey = IDENT.test( key ) ? key : JSON.stringify( key );
    const comma = idx < entries.length - 1 ? ',' : '';
    if ( val !== null && typeof val === 'object' && !Array.isArray( val ) ) {
      // recurse
      const sub = buildFluentObject( val, [ ...pathArr, key ], lvl + 1 );
      lines.push( `${indent( lvl )}${safeKey}: ${sub}${comma}` );
    }
    else {
      // leaf
      const id = [ ...pathArr, key ].join( '_' );
      lines.push(
        `${indent( lvl )}${safeKey}: {`,
        `${indent( lvl + 1 )}format: (args: IntentionalAny): string => formatPattern('${id}', args),`,
        `${indent( lvl + 1 )}createProperty: (args: IntentionalAny): TReadOnlyProperty<string> => formatToProperty('${id}', args)`,
        `${indent( lvl )}}${comma}`
      );
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

  // 3 FTL snippet
  const ftlLines = leaves.map( ( { pathArr } ) => {
    const id = pathArr.join( '_' );

    // ----------  FIX: smarter accessor  ----------
    const accessor = pathArr.reduce( ( acc, key ) => {
      key.split( '.' ).forEach( part => { acc += propAccess( part ); } );
      return acc;
    }, `${pascalCaseRepo}Strings` ) + 'StringProperty.value';
    // ---------------------------------------------

    return `${id} = \${${accessor}}`;
  } ).join( '\n' );

  // TODO: Refactor to deduplicate with the above, see https://github.com/phetsims/chipper/issues/1588
  const stringLines = leaves.map( ( { pathArr } ) => {
    // ----------  FIX: smarter accessor  ----------
    const accessor = pathArr.reduce( ( acc, key ) => {
      key.split( '.' ).forEach( part => { acc += propAccess( part ); } );
      return acc;
    }, `${pascalCaseRepo}Strings` ) + 'StringProperty';
    // ---------------------------------------------

    return accessor;
  } );

  const copyrightLine = await getCopyrightLine( repo, outPath );

  // 4 Fluent object literal
  const fluentObjectLiteral = buildFluentObject( yamlObj );

  // 5 Template TypeScript file
  const fileContents = `${copyrightLine}
// AUTOMATICALLY GENERATED – DO NOT EDIT.
// Generated from ${path.basename( yamlPath )}

/* eslint-disable */
/* @formatter:off */

import Multilink from '../../axon/js/Multilink.js';
import Property from '../../axon/js/Property.js';
import StringProperty from '../../axon/js/StringProperty.js';
import localeProperty from '../../joist/js/i18n/localeProperty.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import FluentUtils from '../../chipper/js/browser/FluentUtils.js';
import { FluentBundle, FluentResource } from '../../chipper/js/browser-and-node/FluentLibrary.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ${camelCaseRepo} from './${camelCaseRepo}.js';
import ${pascalCaseRepo}Strings from './${pascalCaseRepo}Strings.js';
import { isTReadOnlyProperty } from '../../axon/js/TReadOnlyProperty.js';

const getFTL = (): string => {
  const ftl = \`
${ftlLines}
\`;
  return ftl;
};

const allStringProperties = [
  ${stringLines.join( ',\n' )}
];

let isLocaleChanging = false;

localeProperty.lazyLink( () => {
  isLocaleChanging = true;
} );

const rebuildFluentBundle = () => {
  const bundle = new FluentBundle('en');
  const resource = new FluentResource(getFTL());
  const errors = bundle.addResource(resource);
  assert && assert(errors.length === 0, 'Errors when adding resource for locale en');
  
  return bundle;
};

// Initial compute of the bundle
const fluentBundleProperty = new Property<FluentBundle>( rebuildFluentBundle() );

Multilink.multilinkAny( allStringProperties, () => {
  if ( !isLocaleChanging ) {
    fluentBundleProperty.value = rebuildFluentBundle();
  }
} );

// When all strings change due to a locale change, update the bundle once
localeProperty.lazyLink( () => {
  isLocaleChanging = false;
  fluentBundleProperty.value = rebuildFluentBundle();
} );

const formatPattern = (key: string, args: IntentionalAny): string => {
  const bundle = fluentBundleProperty.value;

  const newArgs = FluentUtils.handleFluentArgs(args);

  const message = bundle.getMessage(key);

  const errors: Array<Error> = [];
  const result = bundle.formatPattern(message!.value!, newArgs, errors);
  assert && assert(errors.length === 0, \`Fluent errors found when formatting message: \${errors}\`);
  return result;
};

const formatToProperty = (key: string, args: IntentionalAny): TReadOnlyProperty<string> => {
  const initialValue = formatPattern(key, args);
  const stringProperty = new StringProperty(initialValue);

  const update = () => {
    stringProperty.value = formatPattern(key, args);
  };

  // Whenever any arg changes update the string property
  Object.values(args).forEach(arg => {
    if (isTReadOnlyProperty(arg)) {
      arg.lazyLink(update);
    }
  });

  fluentBundleProperty.lazyLink( () => {
    update();
  } );

  return stringProperty;
};

const ${pascalCaseRepo}Fluent = ${fluentObjectLiteral};

export default ${pascalCaseRepo}Fluent;

${camelCaseRepo}.register('${pascalCaseRepo}Fluent', ${pascalCaseRepo}Fluent);
`;

// 6 write out
  await writeFileAndGitAdd( repo, outPath, fixEOL( fileContents ) );
  console.log( `✅  Wrote ${outPath} with ${leaves.length} messages.` );
};

export default generateFluentTypes;