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
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import { nestJSONStringValues, safeLoadYaml } from '../modulify/convertStringsYamlToJson.js';

type LeafMap = Record<string, string>;

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

  // Build Babel JSON structure: { key: { value, history: [ ... ] } }
  const timestamp = Date.now();
  const babelObject: Record<string, unknown> = {};
  let count = 0;

  for ( const [ key, value ] of Object.entries( leaves ) ) {
    babelObject[ key ] = {
      value: value,
      history: [ {
        userId: userId,
        timestamp: timestamp,
        oldValue: '',
        newValue: value,
        explanation: null
      } ]
    };
    count++;
  }

  const outDir = path.resolve( path.join( '..', 'babel', repo ) );
  fs.mkdirSync( outDir, { recursive: true } );

  const outBase = path.basename( yamlPath ).replace( /\.ya?ml$/u, '.json' );
  const outPath = path.join( outDir, outBase );
  fs.writeFileSync( outPath, JSON.stringify( babelObject, null, 2 ) + '\n' );

  console.log( `yaml-to-babel: wrote ${count} entries` );
  console.log( `  input:  ${yamlPath}` );
  console.log( `  output: ${outPath}` );
} )().catch( e => {
  fail( e instanceof Error ? e.message : String( e ) );
} );