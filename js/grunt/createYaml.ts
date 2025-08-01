// Copyright 2025, University of Colorado Boulder

/**
 * Create the {sim}_en.yaml string file from the {sim}_en.json string file.
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
    if ( json.value ) {
      return json.value;
    }
    const newJson: IntentionalAny = {};
    for ( const key in json ) {
      newJson[ key ] = getValues( json[ key ] );
    }
    return newJson;
  }
  return json;
};

const yamlData = getValues( json );

fs.writeFileSync( yamlFile, yaml.dump( yamlData ) );

console.log( `Created ${yamlFile} from ${jsonFile}. Manually inspect the result. Note that features such as comments, deprecated tags, and phet-io metadata are not supported by this script.` );