// Copyright 2017, University of Colorado Boulder

/**
 * Fills in values for the chipper initialization script script.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const grunt = require( 'grunt' );

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
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    version, // {string}
    dependencies, // {Object} - From getDependencies
    timestamp, // {string}
    thirdPartyEntries, // {Object}
    locale, // {string}
    includeAllLocales, // {boolean}
    isDebugBuild // {boolean}
  } = config;
  assert( _.includes( ChipperConstants.BRANDS, brand ), `Unknown brand: ${brand}` );
  assert( typeof repo === 'string', 'Requires repo' );
  assert( stringMap, 'Requires stringMap' );
  assert( typeof version === 'string', 'Requires version' );
  assert( dependencies, 'Requires dependencies' );
  assert( typeof timestamp === 'string', 'Requires timestamp' );
  assert( thirdPartyEntries, 'Requires thirdPartyEntries' );
  assert( typeof locale === 'string', 'Requires locale' );
  assert( typeof includeAllLocales === 'boolean', 'Requires includeAllLocales' );
  assert( typeof isDebugBuild === 'boolean', 'Requires isDebugBuild' );

  let phetStrings = stringMap;
  if ( !includeAllLocales ) {
    phetStrings = {};
    phetStrings[ locale ] = stringMap[ locale ];
  }

  return ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/chipper-initialization.js' ), {
    PHET_PROJECT: repo,
    PHET_VERSION: version,
    PHET_BUILD_TIMESTAMP: timestamp,
    PHET_BRAND: brand,
    PHET_LOCALE: locale,
    PHET_START_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES,
    PHET_THIRD_PARTY_LICENSE_ENTRIES: JSON.stringify( thirdPartyEntries, null, 2 ),
    PHET_END_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES,
    PHET_DEPENDENCIES: JSON.stringify( dependencies, null, 2 ),
    PHET_STRINGS: JSON.stringify( phetStrings, null, isDebugBuild ? 2 : '' ),
    PHET_IS_DEBUG_BUILD: !!isDebugBuild
  } );
};
