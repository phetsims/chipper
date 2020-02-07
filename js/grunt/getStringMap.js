// Copyright 2015-2020, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 * Requires global.phet.chipper.strings to be set by the string.js plugin.
 */

'use strict';

// built-in node APIs
const assert = require( 'assert' );
const fs = require( 'fs' );
const path = require( 'path' );

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const grunt = require( 'grunt' );
const localeInfo = require( '../data/localeInfo' ); // Locale information

/**
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @param {Array.<string>} usedModules
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function( locales, phetLibs, usedModules ) {

  const usedFileContents = usedModules.map( usedModule => fs.readFileSync( `../${usedModule}`, 'utf-8' ) );

  let reposUsed = [];
  usedFileContents.forEach( fileContent => {
    const allImportStatements = fileContent.match( /import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+-strings.js';/g );
    if ( allImportStatements ) {
      reposUsed.push( ...allImportStatements.map( importStatement => importStatement.match( /\/([\w-]+)-strings\.js/ )[ 1 ] ) );
    }
  } );
  reposUsed = _.uniq( reposUsed );

  // include zh for zh_CN
  const localesWithFallback = _.uniq( locales.concat( locales.filter( locale => locale.length > 2 ).map( locale => locale.slice( 0, 2 ) ) ) );

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file
  reposUsed.forEach( repo => {
    stringFilesContents[ repo ] = {};

    const addLocale = ( locale, isRTL ) => {
      // Read optional string file
      const stringsFilename = path.normalize( `../${locale === 'en' ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json` );
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

      stringFilesContents[ repo ][ locale ] = fileContents;
    };

    locales.forEach( locale => {
      assert( localeInfo[ locale ], `unsupported locale: ${locale}` );
      const isRTL = localeInfo[ locale ].direction === 'rtl';

      addLocale( locale, isRTL );
      if ( locale.length > 2 ) {
        const middleLocale = locale.slice( 0, 2 );
        if ( !locales.includes( middleLocale ) ) {
          addLocale( middleLocale, isRTL );
        }
      }
    } );
  } );

  reposUsed.forEach( repo => {
    let stringAccesses = [];
    const prefix = `${_.camelCase( repo )}Strings`;
    usedFileContents.forEach( ( fileContent, i ) => {
      const matches = fileContent.match( new RegExp( `${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[ '[^']+' \\])+[^\\.\\[]`, 'g' ) );
      if ( matches ) {
        stringAccesses.push( ...matches.map( match => match.slice( 0, match.length - 1 ) ) );
      }
    } );
    stringAccesses = _.uniq( stringAccesses ).map( str => str.slice( prefix.length ) );

    const stringKeysByParts = stringAccesses.map( access => access.match( /\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[ '[^']+' \]/g ).map( token => {
      return token.startsWith( '.' ) ? token.slice( 1 ) : token.slice( 3, token.length - 3 );
    } ) );

    console.log( repo );
    console.log( stringKeysByParts );
  } );

  throw new Error();

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