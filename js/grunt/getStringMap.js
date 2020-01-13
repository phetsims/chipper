// Copyright 2015-2019, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 * Requires global.phet.chipper.strings to be set by the string.js plugin.
 */

'use strict';

// built-in node APIs
const assert = require( 'assert' );
const path = require( 'path' );

// modules
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const grunt = require( 'grunt' );
const localeInfo = require( '../data/localeInfo' ); // Locale information

/**
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function( locales, phetLibs ) {

  const fallbackLocale = ChipperConstants.FALLBACK_LOCALE; // local const to improve readability
  assert( global.phet && global.phet.chipper && global.phet.chipper.strings, 'missing global.phet.chipper.strings' );
  assert( locales.indexOf( fallbackLocale ) !== -1, 'fallback locale is required' );

  // Get metadata of repositories that we want to load strings from (that were referenced in the sim)
  const stringRepositories = []; // { name: {string}, path: {string}, requirejsNamespace: {string} }

  for ( const stringKey in global.phet.chipper.strings ) {
    const repositoryName = global.phet.chipper.strings[ stringKey ].repositoryName;

    // If this repo is not yet in the list
    if ( stringRepositories.every( repo => repo.name !== repositoryName ) ) {
      stringRepositories.push( {
        name: repositoryName,
        path: global.phet.chipper.strings[ stringKey ].repositoryPath,
        requirejsNamespace: global.phet.chipper.strings[ stringKey ].requirejsNamespace
      } );

      // If a string depends on an unlisted dependency, fail out
      if ( phetLibs.indexOf( repositoryName ) < 0 ) {
        throw new Error( `${repositoryName} is missing from phetLibs in package.json` );
      }
    }
  }

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file
  stringRepositories.forEach( function( repository ) {
    stringFilesContents[ repository.name ] = {};

    locales.forEach( function( locale ) {

      assert( localeInfo[ locale ], `unsupported locale: ${locale}` );
      const isRTL = localeInfo[ locale ].direction === 'rtl';

      let basePath;
      // pick a location that is in the repo, or babel
      if ( locale === fallbackLocale ) {
        basePath = `${repository.path}/`;
      }
      else {
        basePath = `${repository.path}/../babel/${repository.name}/`;
      }

      // Read optional string file
      const stringsFilename = path.normalize( `${basePath}${repository.name}-strings_${locale}.json` );
      let fileContents;
      try {
        fileContents = grunt.file.readJSON( stringsFilename );
      }
      catch( error ) {
        grunt.log.debug( `missing string file: ${stringsFilename}` );
        fileContents = {};
      }

      // Format the string values
      ChipperStringUtils.formatStringValues( fileContents, isRTL );

      stringFilesContents[ repository.name ][ locale ] = fileContents;
    } );
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  const stringMap = {};
  locales.forEach( function( locale ) {
    stringMap[ locale ] = {};

    for ( const stringKey in global.phet.chipper.strings ) {
      const stringMetadata = global.phet.chipper.strings[ stringKey ];
      const repositoryName = stringMetadata.repositoryName;
      const key = stringMetadata.key;

      // Extract 'value' field from non-fallback (babel) strings file, and overwrites the default if available.
      const value = ChipperStringUtils.getStringFromMap( stringFilesContents[ repositoryName ][ locale ], key ) ||
                    ChipperStringUtils.getStringFromMap( stringFilesContents[ repositoryName ][ fallbackLocale ], key );

      stringMap[ locale ][ stringKey ] = value;
    }
  } );

  return stringMap;
};