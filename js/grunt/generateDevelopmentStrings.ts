// Copyright 2022-2025, University of Colorado Boulder

/**
 * This script makes a JSON file that combines translations for all locales in a repo. Each locale object has every
 * string key/translated-value pair we have for that locale.  Now supports recursively descending through nested JSON
 * trees so deeply‑nested strings are also included.
 *
 * @author Liam Mulhall (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
// eslint-disable-next-line phet/default-import-match-filename
import fsPromises from 'fs/promises';
import path from 'path';
import dirname from '../../../perennial-alias/js/common/dirname.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import fixEOL from './fixEOL.js';
import { ModulifiedFile } from './modulify/modulify.js';

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

/**
 * Recursively walks a parsed string file, copying only the `{ value: string }` leaves to `destination` while
 * preserving the original nested structure.
 *
 * @param source - Parsed contents of a PhET strings JSON file
 * @param destination - Object that will receive the (possibly nested) `{ value: string }` leaves
 */
const addValuesRecursively = ( source: Record<string, IntentionalAny>, destination: Record<string, IntentionalAny> ): void => {
  for ( const key of Object.keys( source ) ) {
    const node = source[ key ];

    // Guard against prototype pollution or unexpected types
    if ( typeof node !== 'object' || node === null ) {
      continue;
    }

    // Leaf node that holds the translation string as `{ value: '...' }`
    if ( 'value' in node && typeof node.value === 'string' ) {
      destination[ key ] = { value: node.value };
    }
    else {
      // Intermediate branch — recurse to capture nested leaves
      const nextDest: Record<string, IntentionalAny> = {};
      addValuesRecursively( node, nextDest );

      // Only add this branch if it contains at least one string leaf
      if ( Object.keys( nextDest ).length > 0 ) {
        destination[ key ] = nextDest;
      }
    }
  }
};

/**
 * @param repo - repo to generate strings for
 */
export default async ( repo: string ): Promise<void> => {

  const rootPath = path.join( __dirname, '..', '..', '..' );

  // OS-independent path to babel repo.
  const babelPath = path.join( rootPath, 'babel' );

  // Create a file name for the conglomerate string file.
  const conglomerateStringFileName = `${repo}_all.json`;

  const developmentStringContents = ( await getDevelopmentStringsContents( repo ) )?.content ?? null;

  // Do not generate a file if no translations were found.
  if ( developmentStringContents ) {

    // Make sure the output directory exists. The name starts with an underscore so that it appears alphabetically
    // first and looks different from the repo names.
    const outputDir = path.join( babelPath, '_generated_development_strings' );
    try {
      fs.mkdirSync( outputDir );
    }
    catch( e ) {
      // Directory already exists
    }

    const outputPath = path.join( outputDir, conglomerateStringFileName );
    fs.writeFileSync( outputPath, developmentStringContents );
  }
  else {
    console.log( 'no translations found' );
  }
};

export const getDevelopmentStringsContents = async (
  repo: string,
  englishStringModulifiedFile?: ModulifiedFile
): Promise<ModulifiedFile | null> => {

  const usedRelativeFiles: string[] = [];

  const rootPath = path.join( __dirname, '..', '..', '..' );

  // OS-independent path to babel repo.
  const babelPath = path.join( rootPath, 'babel' );

  // Create an empty object for the conglomerate string file that we will add to later.
  const conglomerateStringObject: Record<string, object> = {};

  // Get an array of files (string files) in the repo subdirectory.
  const babelRepoPath = path.join( babelPath, repo );

  // Regex for extracting locale from file name.
  const localeRegex = /(?<=_)(.*)(?=.json)/;

  const stringFiles: string[] = [];
  try {
    usedRelativeFiles.push( `babel/${repo}` );
    const paths: string[] = fs.readdirSync( babelRepoPath );
    stringFiles.push( ...paths.map( p => path.join( babelRepoPath, p ) ) );
  }
  catch( e ) {
    // No translations found in babel. We still continue to generate an (albeit empty) string file.
  }

  const englishStringPath = path.join( rootPath, repo, `${repo}-strings_en.json` );
  usedRelativeFiles.push( `${repo}/${repo}-strings_en.json` );
  if ( fs.existsSync( englishStringPath ) ) {
    stringFiles.push( englishStringPath );
  }

  usedRelativeFiles.push( 'babel/localeData.json' );
  const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // Do not generate a file if no translations were found.
  if ( stringFiles.length > 0 ) {

    // For each string file in the repo subdirectory...
    await Promise.all( stringFiles.map( async stringFile => {
      // Extract the locale.
      const join = stringFile.split( '\\' ).join( '/' );
      const localeMatches = join.substring( join.lastIndexOf( '/' ) ).match( localeRegex );
      assert( localeMatches );
      const locale = localeMatches[ 0 ];

      if ( !localeData[ locale ] ) {
        console.log( '[WARNING] Locale not found in localeData.json: ' + locale );
        return;
      }

      // Get the contents of the string file.
      const overrideEnglish = ( locale === 'en' && englishStringModulifiedFile );
      const stringFileContents = overrideEnglish ? englishStringModulifiedFile.content : ( await fsPromises.readFile( stringFile, 'utf8' ) );
      usedRelativeFiles.push( path.relative( rootPath, stringFile ) );

      // Parse the string file contents.
      const parsedStringFileContents = JSON.parse( stringFileContents );

      // Recursively collect all `{ value }` leaves from the parsed string file.
      const objectToAddToLocale: Record<string, object> = {};
      addValuesRecursively( parsedStringFileContents, objectToAddToLocale );

      // Add the string values to the locale object of the conglomerate string object.
      conglomerateStringObject[ locale ] = objectToAddToLocale;
    } ) );

    // Sort locale keys for deterministic output (Promise.all completion order is non-deterministic)
    const sortedConglomerateStringObject: Record<string, object> = {};
    for ( const locale of Object.keys( conglomerateStringObject ).sort() ) {
      sortedConglomerateStringObject[ locale ] = conglomerateStringObject[ locale ];
    }

    return {
      content: fixEOL( JSON.stringify( sortedConglomerateStringObject, null, 2 ) ),
      usedRelativeFiles: [
        ...usedRelativeFiles.sort(),
        ...( englishStringModulifiedFile?.usedRelativeFiles ?? [] )
      ]
    };
  }
  else {
    return null;
  }
};