// Copyright 2015, University of Colorado Boulder

/**
 * Returns a map such that map[locale][stringKey] will be the string value (with fallbacks to English where needed).
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
  const repoStringMap = {}; // maps [repositoryName][locale] => contents of locale string file
  stringRepositories.forEach( function( repository ) {
    repoStringMap[ repository.name ] = {};

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
      const fileMap = repoStringMap[ repository.name ][ locale ] = {};

      // format the string values
      // TODO: this refactor made it so we loop twice. Zepumph thinks it's worth it to avoid duplication with the string plugin, see https://github.com/phetsims/rosetta/issues/193
      ChipperStringUtils.formatStringValues( fileContents, isRTL );
      for ( const stringKeyMissingPrefix in fileContents ) {

        // Add the requirejs namespaces (eg, JOIST) to the key
        fileMap[ repository.requirejsNamespace + '/' + stringKeyMissingPrefix ] = fileContents[ stringKeyMissingPrefix ];
      }
    } );
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary
  const stringMap = {};
  locales.forEach( function( locale ) {
    stringMap[ locale ] = {};

    for ( const stringKey in global.phet.chipper.strings ) {
      const repositoryName = global.phet.chipper.strings[ stringKey ].repositoryName;

      // English fallback
      const stringsForFallbackLocale = repoStringMap[ repositoryName ][ fallbackLocale ];

      // This method will recurse if needed to find nested string values as well.
      const fallbackString = ChipperStringUtils.getStringFromStringFileContents( stringsForFallbackLocale, stringKey, locale === 'en' );

      // TODO: this does not support nesting at all, does that matter? https://github.com/phetsims/rosetta/issues/193
      stringMap[ locale ][ stringKey ] = fallbackString;

      // Extract 'value' field from non-fallback (babel) strings file, and overwrites the default if available.
      if ( locale !== fallbackLocale &&
           repoStringMap[ repositoryName ] &&
           repoStringMap[ repositoryName ][ locale ] &&
           repoStringMap[ repositoryName ][ locale ][ stringKey ] &&

           // if the string in rosetta is empty we want to use the fallback english string
           repoStringMap[ repositoryName ][ locale ][ stringKey ].value.length > 0 ) {
        stringMap[ locale ][ stringKey ] = repoStringMap[ repositoryName ][ locale ][ stringKey ].value;
      }
    }
  } );

  return stringMap;
};
