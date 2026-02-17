// Copyright 2018-2024, University of Colorado Boulder

/**
 * Fills in values for the chipper initialization script script.
 *
 * NOTE: This should not be minified! It contains licenses that should be human readable as well as important formatting
 * for rosetta translation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import ChipperConstants from '../common/ChipperConstants.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import stringEncoding from '../common/stringEncoding.js';
import transpileForBuild from './transpileForBuild.js';

/**
 * Returns a string for the JS of the initialization script.
 */
export default function getInitializationScript( config: IntentionalAny ): string {
  const {
    brand, // {string}, e.g. 'phet', 'phet-io'
    repo, // {string}
    localeData, // {Object}, map[ locale ] => {Object}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    stringMetadata, // {Object}, map[ stringKey ] => {Object}
    version, // {string}
    dependencies, // {Object} - From getDependencies
    timestamp, // {string}
    locale, // {string}
    includeAllLocales, // {boolean}
    isDebugBuild, // {boolean}
    allowLocaleSwitching, // {boolean}
    encodeStringMap, // {boolean}
    profileFileSize, // {boolean}
    packageObject
  } = config;
  assert( stringMap, 'Requires stringMap' );
  assert( dependencies, 'Requires dependencies' );

  // Load localeData
  const fullLocaleData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // Include a subset of locales' translated strings
  let phetStrings = stringMap;
  if ( !includeAllLocales ) {
    phetStrings = {};

    // Go through all of the potential fallback locales, and include the strings for each of them
    const requiredLocales = [
      // duplicates OK
      locale,
      ...( fullLocaleData[ locale ].fallbackLocales || [] ),
      ChipperConstants.FALLBACK_LOCALE
    ];

    for ( const locale of requiredLocales ) {
      phetStrings[ locale ] = stringMap[ locale ];
    }
  }

  return ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/chipper-initialization.js' ), {
    PHET_PROJECT: repo,
    PHET_VERSION: version,
    PHET_BUILD_TIMESTAMP: timestamp,
    PHET_BRAND: brand,
    PHET_LOCALE: locale,
    PHET_LOCALE_DATA: JSON.stringify( localeData ),
    PHET_DEPENDENCIES: JSON.stringify( dependencies, null, 2 ),
    // If it's a debug build, don't encode the strings, so that they are easier to inspect
    PHET_STRINGS: ( isDebugBuild || !encodeStringMap ) ? JSON.stringify( phetStrings, null, isDebugBuild ? 2 : '' ) : stringEncoding.encodeStringMapToJS( phetStrings ),
    PHET_BEFORE_STRINGS: profileFileSize ? 'console.log("START_STRINGS");' : '',
    PHET_AFTER_STRINGS: profileFileSize ? 'console.log("END_STRINGS");' : '',
    PHET_STRING_METADATA: JSON.stringify( stringMetadata, null, isDebugBuild ? 2 : '' ),
    PHET_IS_DEBUG_BUILD: !!isDebugBuild,
    PHET_ALLOW_LOCALE_SWITCHING: !!allowLocaleSwitching,
    PHET_PACKAGE_OBJECT: JSON.stringify( packageObject ),
    IE_DETECTION_SCRIPT: transpileForBuild( grunt.file.read( '../chipper/js/browser/ie-detection.js' ), true )
  } );
}