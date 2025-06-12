// Copyright 2025, University of Colorado Boulder

/**
 * Converts a YAML file to JSON, nesting each leaf value under a "value" key, and writes the result to a JSON file.
 *
 * TODO: https://github.com/phetsims/chipper/issues/1589 write a message or banner that the JSON file was machine generated and should not be edited manually
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import fs from 'fs';
import yaml from 'js-yaml';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import ChipperStringUtils from '../../common/ChipperStringUtils.js';

/**
 * @param repo - The name of a repo, e.g. 'joist'
 */
export default async ( repo: string ): Promise<void> => {
  const filePath = `../${repo}/${repo}-strings_en.yaml`;
  const yamlContents = fs.readFileSync( filePath, 'utf8' );

  const parsed = safeLoadYaml( yamlContents );

  // Recursively nest all string values and incorporate simMetadata.
  const nested = nestJSONStringValues( parsed );

  // Convert to a pretty-printed JSON string.
  const jsonContents = JSON.stringify( nested, null, 2 );
  const jsonFilename = `${repo}-strings_en.json`;

  await writeFileAndGitAdd( repo, jsonFilename, jsonContents );
};

/**
 * Use js-yaml to parse the YAML contents, preserving key order. The FAILSAFE_SCHEMA is used so that all
 * YAML Scalars are loaded as strings. Otherwise booleans and numbers would be loaded as their native types.
 * @param yamlContents
 */
export const safeLoadYaml = ( yamlContents: string ): IntentionalAny => {
  return yaml.load( yamlContents, { schema: yaml.FAILSAFE_SCHEMA } );
};

/**
 * Recursively processes a YAML-parsed structure:
 * - Wraps string values in an object: ` "string"` becomes `{ "value": "string" }`.
 * - For any key `originalKey`, if a corresponding `originalKey__simMetadata` key exists
 *   at the same level, its value is added as a `simMetadata` property to the object
 *   representing `originalKey`.
 * - `__simMetadata` keys themselves are not included as top-level keys in the output.
 * - Arrays are processed element-wise. If an array itself has `__simMetadata`, it will be
 *   wrapped like: `{ value: [processed elements], simMetadata: {...} }`.
 * - Primitives (numbers, booleans, null) are returned as-is, unless they have `__simMetadata`,
 *   in which case they are wrapped: `{ value: primitive, simMetadata: {...} }`.
 *
 * @param input - The parsed YAML data (can be an object, array, string, or other primitive).
 * @returns The transformed JavaScript structure.
 */
function nestJSONStringValues( input: IntentionalAny ): IntentionalAny {
  // Base case 1: Input is a string
  if ( typeof input === 'string' ) {

    // This allows developers to reference messages with dot notation, which is not valid in Fluent.
    // We replace dots with underscores so it matches the Fluent key format.
    const replacedString = ChipperStringUtils.replaceFluentReferences( input );
    return { value: replacedString };
  }
  // Base case 2: Input is an array
  else if ( Array.isArray( input ) ) {
    // Recursively process each element of the array
    return input.map( item => nestJSONStringValues( item ) );
  }
  // Recursive step: Input is an object (but not null)
  else if ( input !== null && typeof input === 'object' ) {
    const result: Record<string, IntentionalAny> = {};
    const inputKeys = Object.keys( input ); // Get own keys, which preserves order from yaml.load

    for ( const key of inputKeys ) {
      // If the key is a metadata key, check if its parent exists.
      // If so, it will be handled when its parent is processed, so skip.
      if ( key.endsWith( '__simMetadata' ) ) {
        const originalKey = key.substring( 0, key.length - '__simMetadata'.length );
        if ( inputKeys.includes( originalKey ) ) {
          continue; // This metadata will be picked up by the originalKey
        }
        else {
          // Orphaned metadata key. Decide behavior: warn, error, or process as normal.
          // For now, let's warn and skip, as it's not meant to be independent.
          console.warn( `Orphaned __simMetadata key found and skipped: ${key}` );
          continue;
        }
      }

      // Recursively process the value for the current key
      let processedValue = nestJSONStringValues( input[ key ] );

      // Check for corresponding __simMetadata for this key
      const metadataKey = `${key}__simMetadata`;

      // Here's why this is preferred over a simple obj.hasOwnProperty(prop):
      // Avoids issues with shadowed hasOwnProperty: If obj itself has a property named hasOwnProperty (e.g., const obj = { foo: 1, hasOwnProperty: () => false }), then obj.hasOwnProperty('foo') would call the object's own (potentially incorrect) version. Object.prototype.hasOwnProperty.call(obj, 'foo') explicitly calls the original method from Object.prototype.
      // Works with objects created via Object.create(null): Objects created with Object.create(null) do not inherit from Object.prototype and therefore don't have a hasOwnProperty method on them at all. obj.hasOwnProperty would throw an error, but Object.prototype.hasOwnProperty.call(obj, prop) still works.

      // eslint-disable-next-line prefer-object-has-own
      if ( Object.prototype.hasOwnProperty.call( input, metadataKey ) ) {
        const metadataObject = input[ metadataKey ]; // This is the raw metadata, e.g., { phetioReadOnly: true }

        // If processedValue is already a non-array object (i.e., from a string source or object source),
        // we can add simMetadata directly to it.
        if ( typeof processedValue === 'object' && processedValue !== null && !Array.isArray( processedValue ) ) {
          processedValue.simMetadata = metadataObject;
        }
        else {
          // If processedValue is an array or a primitive (number, boolean, null),
          // it needs to be wrapped in an object to hold both its value and the simMetadata.
          processedValue = { value: processedValue, simMetadata: metadataObject };
        }
      }
      result[ key ] = processedValue;
    }
    return result;
  }

  // Base case 3: Input is a number, boolean, or null - return as is.
  return input;
}