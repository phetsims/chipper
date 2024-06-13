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
const _ = require( 'lodash' );
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const transpile = require( './transpile' );
const stringEncoding = require( '../common/stringEncoding' );

/**
 * Returns a string for the JS of the initialization script.
 * @public
 *
 * @param {Object} config
 * @returns {string}
 */
module.exports = function( config ) {
  const {
    brand, // {string}, e.g. 'phet', 'phet-io'
    repo, // {string}
    allLocales, // {string[]} // All locales for which this repo has a translation.
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

  const localesWithTranslations = allLocales;

  // Load localeData - REVIEW: full vs all is confusing, https://github.com/phetsims/chipper/issues/1441
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

  // Include a (larger) subset of locales' localeData. It will need more locales than just the locales directly specified
  // in phet.chipper.strings (the stringMap). We also need locales that will fall back to ANY of those locales in phet.chipper.strings,
  // e.g. if we have an "es" translation, we will include the locale data for "es_PY" because it falls back to "es".
  const includedDataLocales = _.uniq( [
    // Always include the fallback (en)
    ChipperConstants.FALLBACK_LOCALE,

    // Include directly-used locales
    ...localesWithTranslations,

    // Include locales that will fall back to locales with a translation
    ...Object.keys( fullLocaleData ).filter( locale => {
      return fullLocaleData[ locale ].fallbackLocales && fullLocaleData[ locale ].fallbackLocales.some( fallbackLocale => {
        return localesWithTranslations.includes( fallbackLocale );
      } );
    } )
  ] );

  // If a locale is NOT included, and has no fallbacks that are included, BUT IS the fallback for another locale, we
  // should include it. For example, if we have NO "ak" translation, but we have a "tw" translation (which falls back to
  // "ak"), we will want to include "ak" (even though it won't ever contain non-English string translation), because we
  // may want to reference it (and want to not have "broken" locale links localeData).

  // This array would get longer as we iterate through it.
  for ( let i = 0; i < includedDataLocales.length; i++ ) {
    const locale = includedDataLocales[ i ];

    // If our locale is included, we should make sure all of its fallbackLocales are included
    const fallbackLocales = fullLocaleData[ locale ].fallbackLocales;
    if ( fallbackLocales ) {
      for ( const fallbackLocale of fallbackLocales ) {
        if ( !includedDataLocales.includes( fallbackLocale ) ) {
          includedDataLocales.push( fallbackLocale );
        }
      }
    }
  }

  // The set of locales included in generated (subset of) localeData for this specific built simulation file
  // is satisfied by the following closure:
  //
  // 1. If a locale has a translation, include that locale.
  // 2. If one of a locale's localeData[ locale ].fallbackLocales is translated, include that locale.
  // 3. If a locale is in an included localeData[ someOtherLocale ].fallbackLocales, include that locale.
  // 4. Always include the default locale "en".
  const localeData = {};
  for ( const locale of _.sortBy( includedDataLocales ) ) {
    localeData[ locale ] = fullLocaleData[ locale ];
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
    IE_DETECTION_SCRIPT: transpile( grunt.file.read( '../chipper/js/ie-detection.js' ), true )
  } );
};