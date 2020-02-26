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
 * @param {Array.<string>} usedModules - relative file path of the module (filename) from the repos root
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function( locales, phetLibs, usedModules ) {

  assert( locales.indexOf( ChipperConstants.FALLBACK_LOCALE ) !== -1, 'fallback locale is required' );

  const localeFallbacks = locale => {
    return [
      ...( locale !== ChipperConstants.FALLBACK_LOCALE ? [ locale ] : [] ), // e.g. 'zh_CN'
      ...( ( locale.length > 2 && locale.slice( 0, 2 ) !== ChipperConstants.FALLBACK_LOCALE ) ? [ locale.slice( 0, 2 ) ] : [] ), // e.g. 'zh'
      ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
    ];
  };

  const usedFileContents = usedModules.map( usedModule => fs.readFileSync( `../${usedModule}`, 'utf-8' ) );

  let reposUsed = [];
  usedFileContents.forEach( fileContent => {
    const allImportStatements = fileContent.match( /import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+-strings.js';/g );
    if ( allImportStatements ) {
      reposUsed.push( ...allImportStatements.map( importStatement => importStatement.match( /\/([\w-]+)-strings\.js/ )[ 1 ] ) );
    }
  } );
  reposUsed = _.uniq( reposUsed );

  const requirejsNamespaceMap = {};
  reposUsed.forEach( repo => {
    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf-8' ) );
    requirejsNamespaceMap[ repo ] = packageObject.phet.requirejsNamespace;
  } );

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file
  reposUsed.forEach( repo => {
    stringFilesContents[ repo ] = {};

    const addLocale = ( locale, isRTL ) => {
      // Read optional string file
      const stringsFilename = path.normalize( `../${locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json` );
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

  const stringMap = {};
  locales.forEach( locale => {
    stringMap[ locale ] = {};
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposUsed.forEach( repo => {
    let stringAccesses = [];
    const prefix = `${_.camelCase( repo )}Strings`;
    usedFileContents.forEach( ( fileContent, i ) => {
      if ( fileContent.includes( `import ${prefix} from` ) ) {
        const matches = fileContent.match( new RegExp( `${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[ '[^']+' \\])+[^\\.\\[]`, 'g' ) );
        if ( matches ) {
          stringAccesses.push( ...matches.map( match => match.slice( 0, match.length - 1 ) ).filter( m => m !== `${prefix}.get` ) );
        }

        const workaroundMatches = fileContent.match( new RegExp( `${prefix}\\.get\\( '([^']+)' \\)`, 'g' ) );
        if ( workaroundMatches ) {
          stringAccesses.push( ...workaroundMatches.map( match => `${prefix}.${match.slice( match.indexOf( '\'' ) + 1, match.lastIndexOf( '\'' ) )}` ) );
        }
      }
    } );
    stringAccesses = _.uniq( stringAccesses ).map( str => str.slice( prefix.length ) );

    const stringKeysByParts = stringAccesses.map( access => access.match( /\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[ '[^']+' \]/g ).map( token => {
      return token.startsWith( '.' ) ? token.slice( 1 ) : token.slice( 3, token.length - 3 );
    } ) );

    const partialStringKeys = _.uniq( stringKeysByParts.map( parts => parts.join( '.' ) ) );

    partialStringKeys.forEach( partialStringKey => {
      locales.forEach( locale => {
        let stringValue = null;
        for ( const fallbackLocale of localeFallbacks( locale ) ) {
          const stringFileContents = stringFilesContents[ repo ][ fallbackLocale ];
          if ( stringFileContents ) {
            stringValue = ChipperStringUtils.getStringFromMap( stringFileContents, partialStringKey );
            if ( stringValue ) {
              break;
            }
          }
        }
        assert( stringValue !== null, `Missing string information for ${repo} ${partialStringKey}` );

        stringMap[ locale ][ `${requirejsNamespaceMap[ repo ]}/${partialStringKey}` ] = stringValue;
      } );
    } );
  } );

  return stringMap;
};