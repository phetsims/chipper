// Copyright 2025, University of Colorado Boulder

/**
 * Create the {sim}_en.yaml string file from the {sim}_en.json string file.
 * 
 * This script now supports extracting metadata from JSON to YAML:
 * - deprecated: true → __deprecated: true
 * - _comment: "text" → __comment: "text"
 * - simMetadata: {...} → __simMetadata: {...}
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import getRepo from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

const repo = getRepo();

const jsonFile = `../${repo}/${repo}-strings_en.json`;
const yamlFile = `../${repo}/${repo}-strings_en.yaml`;

const json = JSON.parse( fs.readFileSync( jsonFile, 'utf8' ) );

const getValues = ( json: IntentionalAny ): IntentionalAny => {
  if ( typeof json === 'object' && json !== null ) {
    // If this object has a 'value' property, it's a string entry
    if ( json.hasOwnProperty( 'value' ) ) {
      
      // First, process the base key with its value
      const baseResult = json.value;
      
      // Then check for metadata and add sibling keys
      const metadata: IntentionalAny = {};
      
      if ( json.deprecated === true ) {
        metadata.__deprecated = true;
      }
      
      if ( json._comment ) {
        metadata.__comment = json._comment;
      }
      
      if ( json.simMetadata ) {
        metadata.__simMetadata = json.simMetadata;
      }
      
      // If we have metadata, we need to return an object that will be processed later
      if ( Object.keys( metadata ).length > 0 ) {
        const result: IntentionalAny = { __value: baseResult };
        // Add metadata properties individually to avoid spread on non-literal
        for ( const key in metadata ) {
          result[ key ] = metadata[ key ];
        }
        return result;
      }
      
      return baseResult;
    }
    
    // Otherwise, recursively process all properties
    const newJson: IntentionalAny = {};
    for ( const key in json ) {
      const processed = getValues( json[ key ] );
      
      // If the processed value has metadata, we need to split it into separate keys
      if ( typeof processed === 'object' && processed !== null && processed.__value !== undefined ) {
        newJson[ key ] = processed.__value;
        
        // Add metadata as sibling keys
        for ( const metaKey in processed ) {
          if ( metaKey !== '__value' ) {
            newJson[ key + metaKey ] = processed[ metaKey ];
          }
        }
      }
      else {
        newJson[ key ] = processed;
      }
    }
    return newJson;
  }
  return json;
};

const yamlData = getValues( json );

fs.writeFileSync( yamlFile, yaml.dump( yamlData ) );

console.log( `Created ${yamlFile} from ${jsonFile}. Manually inspect the result. This script now supports deprecated tags, comments, and simMetadata.` );