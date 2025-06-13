// Copyright 2015-2025, University of Colorado Boulder

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import assert from 'assert';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import { PhetioElementMetadata } from '../../../tandem/js/phet-io-types.js';
import ChipperConstants from '../common/ChipperConstants.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import pascalCase from '../common/pascalCase.js';
import { getFluentInternalReferences } from './modulify/getFluentInternalReferences.js';

export type Locale = string;

// TODO: Use this in all spots importing localeData.json https://github.com/phetsims/chipper/issues/1539
export type LocaleData = Record<Locale, {
  englishName: string;
  localizedName: string;
  direction: 'rtl' | 'ltr';
  locale3?: string;
  fallbackLocales?: Locale[];
}>;

// Metadata for a single string key from an english strings file
type StringKeyMetadata = Record<string, boolean | string | number> & PhetioElementMetadata;

const localeData: LocaleData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

// TODO: https://github.com/phetsims/chipper/issues/1537
export type StringMap = Record<string, Record<string, string>>;

/**
 * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
 * 'ar_AE' => [ 'ar_AE', 'ar', 'ar_MA', 'en' ]   (note, changed from zh_CN example, which does NOT use 'zh' as a fallback anymore)
 * 'es' => [ 'es', 'en' ]
 * 'en' => [ 'en' ]
 *
 */
const localeFallbacks = ( locale: Locale ): Locale[] => {
  return [
    ...( locale !== ChipperConstants.FALLBACK_LOCALE ? [ locale ] : [] ),
    ...( localeData[ locale ].fallbackLocales || [] ),
    ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
  ];
};

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param locales - All supported locales for this build
 * @returns - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
const getStringFilesContents = ( reposWithUsedStrings: string[], locales: Locale[] ): StringMap => {
  const stringFilesContents: StringMap = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach( repo => {
    stringFilesContents[ repo ] = {} as Record<string, string>;

    /**
     * Adds a locale into our stringFilesContents map.
     */
    const addLocale = ( locale: string, isRTL: boolean ) => {
      // Read optional string file
      const stringsFilename = path.normalize( `../${locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json` );
      let fileContents;
      try {
        fileContents = JSON.parse( fs.readFileSync( stringsFilename, 'utf-8' ) );
      }
      catch( error ) {
        grunt.log.verbose.writeln( `missing string file: ${stringsFilename}` );
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
 * @param mainRepo
 * @param locales
 * @param phetLibs - Used to check for bad string dependencies
 * @param usedModules - relative file path of the module (filename) from the repos root
 */
export default function getStringMap( mainRepo: string, locales: string[], phetLibs: string[], usedModules: string[] ): { stringMap: StringMap; stringMetadata: Record<string, StringKeyMetadata> } {

  assert( locales.includes( ChipperConstants.FALLBACK_LOCALE ), 'fallback locale is required' );

  // --------------------------------------------------------------------
  // The Fluent.js file uses all Strings.js keys internally so they do not count as usages.
  // --------------------------------------------------------------------
  const nonFluentModules = usedModules.filter( modulePath => !modulePath.endsWith( 'Fluent.js' ) );

  // Load the file contents of every single JS module that used any strings
  const usedFileContents = nonFluentModules.map( usedModule => fs.readFileSync( `../${usedModule}`, 'utf-8' ) );

  // Compute which repositories contain one or more used strings (since we'll need to load string files for those
  // repositories).
  let reposWithUsedStrings = [];
  usedFileContents.forEach( fileContent => {
    // Accept imports for either *Strings.js or *Fluent.js
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    const allImportStatements = fileContent.match( /import [a-zA-Z_$][a-zA-Z0-9_$]*(Strings|Fluent) from '[^\n\r]+(Strings|Fluent)\.js';/g );
    if ( allImportStatements ) {
      reposWithUsedStrings.push( ...allImportStatements.map( importStatement => {
        // Grabs out the prefix before `Strings.js` OR `Fluent.js` (without the leading slash)
        const importName = importStatement.match( /\/([\w-]+)(Strings|Fluent)\.js/ )[ 1 ];

        // kebab case the repo
        return _.kebabCase( importName );
      } ) );
    }
  } );
  reposWithUsedStrings = _.uniq( reposWithUsedStrings ).filter( repo => {
    return fs.existsSync( `../${repo}/package.json` );
  } );

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `JoistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
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
  const stringMetadata = {};
  locales.forEach( locale => {
    stringMap[ locale ] = {};
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach( repo => {

    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `JoistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `JoistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    let stringAccesses = [];

    // We need to look for both SomethingStrings.* and SomethingFluent.*
    const prefixes = [
      `${pascalCase( repo )}Strings`,
      `${pascalCase( repo )}Fluent`
    ];

    prefixes.forEach( prefix => {
      usedFileContents.forEach( fileContent => {

        // Only scan files where we can identify an import for it
        if ( fileContent.includes( `import ${prefix} from` ) ) {

          // Look for normal matches, e.g. `JoistStrings.` followed by one or more chunks like:
          // .somethingVaguely_alphaNum3r1c
          // [ 'aStringInBracketsBecauseOfSpecialCharacters' ]
          //
          // It will also then end on anything that doesn't look like another one of those chunks
          // [a-zA-Z_$][a-zA-Z0-9_$]* ---- this grabs things that looks like valid JS identifiers
          // \\[ '[^']+' \\])+ ---- this grabs things like our second case above
          // [^\\.\\[] ---- matches something at the end that is NOT either of those other two cases
          // It is also generalized to support arbitrary whitespace and requires that ' match ' or " match ", since
          // this must support JS code and minified TypeScript code
          // Matches one final character that is not '.' or '[', since any valid string accesses should NOT have that
          // after. NOTE: there are some degenerate cases that will break this, e.g.:
          // - JoistStrings.someStringProperty[ 0 ]
          // - JoistStrings.something[ 0 ]
          // - JoistStrings.something[ 'length' ]
          const matches = fileContent.match( new RegExp( `${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['"][^'"]+['"]\\s*\\])+[^\\.\\[]`, 'g' ) );
          if ( matches ) {
            stringAccesses.push( ...matches.map( match => {
              return match
                // We always have to strip off the last character - it's a character that shouldn't be in a string access
                .slice( 0, match.length - 1 )
                // Handle JoistStrings[ 'some-thingStringProperty' ].value => JoistStrings[ 'some-thing' ]
                // -- Anything after StringProperty should go
                // away, but we need to add the final '] to maintain the format
                .replace( /StringProperty'\s?].*/, '\']' )
                // Handle JoistStrings.somethingStringProperty.value => JoistStrings.something
                .replace( /StringProperty.*/, '' )
                // .format( ... )
                .replace( /\.format.*/, '' )
                // .createProperty( ... )
                .replace( /\.createProperty.*/, '' )
                // Normalize whitespace
                .replace( /\[ '/g, '[\'' )
                .replace( /' \]/g, '\']' );
            } ) );
          }
        }
      } );
    } );

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq( stringAccesses ).map( str => {
      // Take off whichever prefix it had (Strings or Fluent)
      return prefixes.reduce( ( acc, pre ) => acc.startsWith( pre ) ? acc.slice( pre.length ) : acc, str );
    } );

    // This will hold the keys in the strings file that are referred to by fluent patterns. They may not have direct
    // usages in simulation code, but are dependencies on other patterns so they must be marked considered used.
    const keysUsedByFluent = new Set<string>();
    const englishStringContents = stringFilesContents[ repo ][ ChipperConstants.FALLBACK_LOCALE ];

    const fluentKeyMap = ChipperStringUtils.getFluentKeyMap( englishStringContents );
    const ftl = ChipperStringUtils.createFluentFileFromData( fluentKeyMap.values() );

    // Loop over every fluent key in the file.
    fluentKeyMap.forEach( entry => {
      const fluentKey = entry.fluentKey;

      // Every string referenced in simulation code, in its fluent key form. A leading '.' is removed from the key assembled in stringAccesses.
      const fluentFormsAccessed = stringAccesses.map( stringAccess => ChipperStringUtils.createFluentKey( stringAccess.substring( 1 ) ) );

      // The fluent key is used in simulation code. So all references in its pattern value must be considered used.
      if ( fluentFormsAccessed.includes( fluentKey ) ) {

        // All references used by this fluent key, catching deeply nested references.
        const references = getFluentInternalReferences( ftl, fluentKey );
        references.forEach( reference => {

          // Convert the fluent key back to its JSON style, replacing underscores with dots. Add a leading dot back to match the
          // format of the stringAccesses.
          const jsonFormattedReference = ( '.' + reference ).replace( /_/g, '.' );
          keysUsedByFluent.add( jsonFormattedReference );
        } );
      }
    } );

    stringAccesses.push( ...Array.from( keysUsedByFluent ) );

    // The JS outputted by TS is minified and missing the whitespace
    const depth = 2;

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    const stringKeysByParts = stringAccesses.map( access => access.match( /\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g ).map( token => {
      return token.startsWith( '.' ) ? token.slice( 1 ) : token.slice( depth, token.length - depth );
    } ) );

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    const partialStringKeys = _.uniq( stringKeysByParts.map( parts => parts.join( '.' ) ) ).filter( key => key !== 'js' );

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
    partialStringKeys.forEach( partialStringKey => {
      locales.forEach( locale => {
        let stringEntry = null;
        for ( const fallbackLocale of localeFallbacks( locale ) ) {
          const stringFileContents = stringFilesContents[ repo ][ fallbackLocale ];
          if ( stringFileContents ) {
            stringEntry = ChipperStringUtils.getStringEntryFromMap( stringFileContents, partialStringKey );
            if ( stringEntry ) {
              break;
            }
          }
        }
        if ( !partialStringKey.endsWith( 'StringProperty' ) ) {
          assert( stringEntry !== null, `Missing string information for ${repo} ${partialStringKey}` );

          const stringKey = `${requirejsNamespaceMap[ repo ]}/${partialStringKey}`;
          // Normalize the string value, so that it will not generate warnings for HTML validation,
          // see https://github.com/phetsims/scenery/issues/1687
          stringMap[ locale ][ stringKey ] = stringEntry.value.normalize();
          if ( stringEntry.simMetadata && locale === ChipperConstants.FALLBACK_LOCALE ) {
            stringMetadata[ stringKey ] = stringEntry.simMetadata;
          }
        }
      } );
    } );
  } );

  return { stringMap: stringMap, stringMetadata: stringMetadata };
}