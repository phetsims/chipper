// Copyright 2018-2024, University of Colorado Boulder

/**
 * Fills in values for the chipper initialization script script.
 *
 * NOTE: This should not be minified! It contains licenses that should be human readable as well as important formatting
 * for rosetta translation.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const transpileForBuild = require( './transpileForBuild.js' );
const stringEncoding = require( '../common/stringEncoding' );

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.ts';

/**
 * Returns a string for the JS of the initialization script.
 */
export default function( config: IntentionalAny ): string {
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
  assert( typeof repo === 'string', 'Requires repo' );
  assert( stringMap, 'Requires stringMap' );
  assert( typeof version === 'string', 'Requires version' );
  assert( dependencies, 'Requires dependencies' );
  assert( typeof timestamp === 'string', 'Requires timestamp' );
  assert( typeof locale === 'string', 'Requires locale' );
  assert( typeof includeAllLocales === 'boolean', 'Requires includeAllLocales' );
  assert( typeof isDebugBuild === 'boolean', 'Requires isDebugBuild' );

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
    IE_DETECTION_SCRIPT: transpileForBuild( grunt.file.read( '../chipper/js/ie-detection.js' ), true )
  } );
}