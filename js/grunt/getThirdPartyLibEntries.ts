// Copyright 2015-2024, University of Colorado Boulder

/**
 * This function returns an object literal that describes the third-party libraries that are included in the html deliverable.
 * License info is read from sherpa/lib/license.json, and the format of the object literal is similar to that syntax.
 *
 * See getLicenseEntry.js for a description & syntax of the license entries
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import _ from 'lodash';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import getLicenseKeys from './getLicenseKeys.js';

const THIRD_PARTY_LICENSES_FILENAME = '../sherpa/lib/license.json'; // contains third-party license info
const LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

export default function getThirdPartyLibEntries( repo: string, brand: string ): Record<string, string> {

  // Read license info
  const licenseInfo = JSON.parse( readFileSync( THIRD_PARTY_LICENSES_FILENAME, 'utf8' ) );

  let licenseKeys = getLicenseKeys( repo, brand );

  // Add all dependencies. Duplicates will be removed later.
  for ( let i = 0; i < licenseKeys.length; i++ ) {
    const license = licenseInfo[ licenseKeys[ i ] ];
    assert( license, `${THIRD_PARTY_LICENSES_FILENAME}: no entry for key = ${licenseKeys[ i ]}` );
    const dependencies = license.dependencies;
    if ( typeof dependencies === 'object' ) {
      licenseKeys = licenseKeys.concat( dependencies );
    }
  }

  // Sort keys and remove duplicates
  licenseKeys = _.uniq( _.sortBy( licenseKeys, ( key: string ) => key.toUpperCase() ) );

  grunt.log.verbose.writeln( `licenseKeys = ${licenseKeys.toString()}` );

  // Combine all licenses into 1 object literal
  const libEntries: Record<string, string> = {};
  licenseKeys.forEach( key => {

    const license = licenseInfo[ key ];

    // verify required keys
    assert( license, `${THIRD_PARTY_LICENSES_FILENAME}: no entry for key = ${key}` );
    assert( license.text, `${THIRD_PARTY_LICENSES_FILENAME}: no text field for key = ${key}` );
    assert( license.license, `${THIRD_PARTY_LICENSES_FILENAME}: no license field for key = ${key}` );
    assert( license.projectURL, `${THIRD_PARTY_LICENSES_FILENAME}: no projectURL field for key = ${key}` );
    assert( license.notes, `${THIRD_PARTY_LICENSES_FILENAME}: no notes field for key = ${key}` );

    // read the license file
    const licenseText = grunt.file.read( `${LICENSES_DIRECTORY + key}.txt` );
    license.licenseText = licenseText.split( /\r?\n/ );

    libEntries[ key ] = license;
  } );

  return libEntries;
}