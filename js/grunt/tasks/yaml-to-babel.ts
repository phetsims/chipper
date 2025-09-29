// Copyright 2025, University of Colorado Boulder

/**
 * Convert a strings YAML file into a Babel-compatible JSON with history metadata.
 *
 * Usage:
 *   grunt yaml-to-babel --file=<path/to/file_es.yaml> --userID=<number>
 *
 * Writes:
 *   ../babel/<repo>/<basename>.json
 *
 * Notes:
 * - Only include { value, history } in the output (strip other metadata).
 * - history contains a single entry for new strings with userId, timestamp (ms), oldValue: "", newValue: value, explanation: null.
 * - The YAML parsing and nesting behavior is shared with convertStringsYamlToJson.ts.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import path from 'path';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import { nestJSONStringValues, safeLoadYaml } from '../modulify/convertStringsYamlToJson.js';

type LeafMap = Record<string, string>;

type BabelEntryData = Record<string, unknown> & { value?: unknown };
type BabelJson = Record<string, BabelEntryData>;

function fail( message: string ): never {
  console.error( `yaml-to-babel error: ${message}` );
  process.exit( 1 );
}

// Collect leaves where an object has a string-valued `value` member. The flattened key path uses dot notation.
function collectValueLeaves( node: unknown, prefix: string[], out: LeafMap ): void {
  if ( node && typeof node === 'object' && !Array.isArray( node ) ) {
    const obj = node as Record<string, unknown>;

    // Leaf: includes a string value property
    // eslint-disable-next-line prefer-object-has-own
    if ( Object.prototype.hasOwnProperty.call( obj, 'value' ) && typeof obj.value === 'string' ) {
      const key = prefix.join( '.' );
      if ( key.length === 0 ) {
        // Shouldn't happen for a well-formed strings file
        return;
      }
      out[ key ] = obj.value;
      return;
    }

    // Recurse into children, skipping known metadata properties we must strip
    for ( const [ k, v ] of Object.entries( obj ) ) {
      if ( k === 'simMetadata' || k === 'deprecated' || k === '_comment' ) {
        continue; // strip metadata for Babel output
      }
      collectValueLeaves( v, [ ...prefix, k ], out );
    }
  }
  else if ( Array.isArray( node ) ) {
    // Handle arrays by indexing into elements. Rare in YAML strings, but supported for robustness.
    node.forEach( ( child, index ) => {
      collectValueLeaves( child, [ ...prefix, String( index ) ], out );
    } );
  }
}

( async () => {
  const repo = getRepo();

  const yamlPathOption = getOption<string>( 'file' );
  const userIdOption = getOption<string | number>( 'userID' );

  if ( !yamlPathOption ) {
    fail( 'missing required --file option' );
  }
  if ( userIdOption === undefined || userIdOption === null || ( typeof userIdOption === 'string' && userIdOption.trim() === '' ) ) {
    fail( 'missing required --userID option' );
  }

  const userId = Number( userIdOption );
  if ( !Number.isFinite( userId ) || Number.isNaN( userId ) ) {
    fail( `userID must be numeric, got: ${String( userIdOption )}` );
  }

  const yamlPath = path.resolve( yamlPathOption );
  if ( !fs.existsSync( yamlPath ) ) {
    fail( `YAML file not found: ${yamlPath}` );
  }

  // Read YAML and convert to nested structure
  const yamlContents = fs.readFileSync( yamlPath, 'utf8' );
  const parsed = safeLoadYaml( yamlContents );
  const nested = nestJSONStringValues( parsed );

  // Flatten to a map of dot-path -> string value (strip metadata)
  const leaves: LeafMap = {};
  collectValueLeaves( nested, [], leaves );

  const filterA11yOnly = isOptionKeyProvided( 'a11y' ) ? getOption( 'a11y' ) !== false : false;

  let leafEntries = Object.entries( leaves );
  if ( filterA11yOnly ) {
    // Only contribute strings scoped under the `a11y` namespace.
    leafEntries = leafEntries.filter( ( [ key ] ) => key.startsWith( 'a11y.' ) );
  }
  const leafCount = leafEntries.length;

  const outDir = path.resolve( path.join( '..', 'babel', repo ) );
  fs.mkdirSync( outDir, { recursive: true } );

  const outBase = path.basename( yamlPath ).replace( /\.ya?ml$/u, '.json' );
  const outPath = path.join( outDir, outBase );

  const leavesMap = new Map<string, string>( leafEntries );

  let existingEntries: [ string, BabelEntryData ][] = [];
  if ( fs.existsSync( outPath ) ) {
    const existingContent = fs.readFileSync( outPath, 'utf8' );
    let parsedExisting: unknown;
    try {
      parsedExisting = JSON.parse( existingContent ) as BabelJson;
    }
    catch( e ) {
      fail( `unable to parse existing Babel JSON: ${e instanceof Error ? e.message : String( e )}` );
    }

    if ( parsedExisting && typeof parsedExisting === 'object' && !Array.isArray( parsedExisting ) ) {
      existingEntries = Object.entries( parsedExisting as BabelJson );
    }
    else {
      fail( 'existing Babel JSON is not an object' );
    }
  }

  const timestamp = Date.now();
  const createNewEntry = ( value: string ): BabelEntryData => ( {
    value: value,
    history: [ {
      userId: userId,
      timestamp: timestamp,
      oldValue: '',
      newValue: value,
      explanation: null
    } ]
  } );

  const mergedEntries: [ string, BabelEntryData ][] = [];

  for ( const [ key, existingEntry ] of existingEntries ) {
    let mergedEntry = existingEntry;

    if ( leavesMap.has( key ) ) {
      const newValue = leavesMap.get( key )!;
      if ( existingEntry && typeof existingEntry === 'object' && !Array.isArray( existingEntry ) ) {

        // makeshift clone
        // eslint-disable-next-line phet/no-object-spread-on-non-literals
        mergedEntry = { ...existingEntry } as BabelEntryData;
        ( mergedEntry ).value = newValue;
      }
      else {
        mergedEntry = createNewEntry( newValue );
      }
      leavesMap.delete( key );
    }

    mergedEntries.push( [ key, mergedEntry ] );
  }

  const newKeys = Array.from( leavesMap.entries() ).sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) );
  for ( const [ key, value ] of newKeys ) {
    mergedEntries.push( [ key, createNewEntry( value ) ] );
  }

  const babelObject = Object.fromEntries( mergedEntries );
  fs.writeFileSync( outPath, JSON.stringify( babelObject, null, 2 ) + '\n' );

  console.log( `yaml-to-babel: wrote ${leafCount} entries` );
  console.log( `  input:  ${yamlPath}` );
  console.log( `  output: ${outPath}` );
} )().catch( e => {
  fail( e instanceof Error ? e.message : String( e ) );
} );
