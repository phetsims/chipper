// Copyright 2015-2021, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 */


const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const path = require( 'path' );

const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

/**
 * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
 * 'ar_AE' => [ 'ar_AE', 'ar', 'ar_MA', 'en' ]   (note, changed from zh_CN example, which does NOT use 'zh' as a fallback anymore)
 * 'es' => [ 'es', 'en' ]
 * 'en' => [ 'en' ]
 *
 * @param {string} locale
 * @returns {Array.<string>}
 */
const localeFallbacks = locale => {
  return [
    ...( locale !== ChipperConstants.FALLBACK_LOCALE ? [ locale ] : [] ),
    ...( localeData[ locale ].fallbackLocales || [] ),
    ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
  ];
};

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param {Array.<string>} reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param {Array.<string>} locales - All supported locales for this build
 * @returns {Object} - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
const getStringFilesContents = ( reposWithUsedStrings, locales ) => {
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach( repo => {
    stringFilesContents[ repo ] = {};

    /**
     * Adds a locale into our stringFilesContents map.
     *
     * @param {string} locale
     * @param {boolean} isRTL
     */
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

    // Include fallback locales (they may have duplicates)
    const includedLocales = _.sortBy( _.uniq( locales.flatMap( locale => {
      assert( localeData[ locale ], `unsupported locale: ${locale}` );

      return localeFallbacks( locale );
    } ) ) );

    includedLocales.forEach( locale => addLocale( locale, localeData[ locale ].direction === 'rtl' ) );
  } );

  return stringFilesContents;
};

/**
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @param {Array.<string>} usedModules - relative file path of the module (filename) from the repos root
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function( locales, phetLibs, usedModules ) {

  assert( locales.indexOf( ChipperConstants.FALLBACK_LOCALE ) !== -1, 'fallback locale is required' );

  // Load the file contents of every single JS module that used any strings
  const usedFileContents = usedModules.map( usedModule => fs.readFileSync( `../${usedModule}`, 'utf-8' ) );

  // Compute which repositories contain one more more used strings (since we'll need to load string files for those
  // repositories).
  let reposWithUsedStrings = [];
  usedFileContents.forEach( fileContent => {
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    const allImportStatements = fileContent.match( /import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+Strings.js';/g );
    if ( allImportStatements ) {
      reposWithUsedStrings.push( ...allImportStatements.map( importStatement => {
        // Grabs out the prefix before `Strings.js` (without the leading slash too)
        const importName = importStatement.match( /\/([\w-]+)Strings\.js/ )[ 1 ];

        // un-camel-case
        let repo = importName;
        for ( let i = 0; i < repo.length; i++ ) {
          if ( repo[ i ] >= 'A' && repo[ i ] <= 'Z' ) {
            repo = `${repo.slice( 0, i )}-${repo[ i ].toLowerCase()}${repo.slice( i + 1 )}`;
          }
        }
        return repo;
      } ) );
    }
  } );
  reposWithUsedStrings = _.uniq( reposWithUsedStrings ).filter( repo => {
    return fs.existsSync( `../${repo}/package.json` );
  } );

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `joistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
  const requirejsNamespaceMap = {};
  reposWithUsedStrings.forEach( repo => {
    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf-8' ) );
    requirejsNamespaceMap[ repo ] = packageObject.phet.requirejsNamespace;
  } );

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  // maps [repositoryName][locale] => contents of locale string file
  const stringFilesContents = getStringFilesContents( reposWithUsedStrings, locales );

  // Initialize our full stringMap object (which will be filled with results and then returned as our string map).
  const stringMap = {};
  locales.forEach( locale => {
    stringMap[ locale ] = {};
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach( repo => {

    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `joistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `joistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    let stringAccesses = [];
    const prefix = `${_.camelCase( repo )}Strings`; // e.g. joistStrings
    usedFileContents.forEach( ( fileContent, i ) => {
      // Only scan files where we can identify an import for it
      if ( fileContent.includes( `import ${prefix} from` ) ) {

        // Look for normal matches, e.g. `joistStrings.` followed by one or more chunks like:
        // .somethingVaguely_alphaNum3r1c
        // [ 'aStringInBracketsBecauseOfSpecialCharacters' ]
        //
        // It will also then end on anything that doesn't look like another one of those chunks
        // [a-zA-Z_$][a-zA-Z0-9_$]* ---- this grabs things that looks like valid JS identifiers
        // \\[ '[^']+' \\])+ ---- this grabs things like our second case above
        // [^\\.\\[] ---- matches something at the end that is NOT either of those other two cases
        const matches = fileContent.match( new RegExp( `${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[ '[^']+' \\])+[^\\.\\[]`, 'g' ) );
        if ( matches ) {
          stringAccesses.push( ...matches.map( match => match.slice( 0, match.length - 1 ) ).filter( m => m !== `${prefix}.get` ) );
        }

        // Look for backup matches, e.g. `joistStrings.get( 'fullString' )`
        const workaroundMatches = fileContent.match( new RegExp( `${prefix}\\.get\\( '([^']+)' \\)`, 'g' ) );
        if ( workaroundMatches ) {
          stringAccesses.push( ...workaroundMatches.map( match => `${prefix}.${match.slice( match.indexOf( '\'' ) + 1, match.lastIndexOf( '\'' ) )}` ) );
        }
      }
    } );

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq( stringAccesses ).map( str => str.slice( prefix.length ) );

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    const stringKeysByParts = stringAccesses.map( access => access.match( /\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[ '[^']+' \]/g ).map( token => {
      return token.startsWith( '.' ) ? token.slice( 1 ) : token.slice( 3, token.length - 3 );
    } ) );

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    const partialStringKeys = _.uniq( stringKeysByParts.map( parts => parts.join( '.' ) ) ).filter( key => key !== 'js' );

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
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