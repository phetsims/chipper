// Copyright 2022-2025, University of Colorado Boulder

/**
 * This script makes a JSON file that combines translations for all locales in a repo. Each locale object has every
 * string key/translated-value pair we have for that locale.
 *
 * @author Liam Mulhall (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import dirname from '../../../perennial-alias/js/common/dirname.js';
import fixEOL from './fixEOL.js';

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

/**
 * @param repo - repo to generate strings for
 */
export default ( repo: string ): void => {

  const start = Date.now();

  const rootPath = path.join( __dirname, '..', '..', '..' );

  // OS-independent path to babel repo.
  const babelPath = path.join( rootPath, 'babel' );

  // Create a file name for the conglomerate string file.
  const conglomerateStringFileName = `${repo}_all.json`;

  // Create an empty object for the conglomerate string file that we will add to later.
  const conglomerateStringObject: Record<string, object> = {};

  // Get an array of files (string files) in the repo subdirectory.
  const babelRepoPath = path.join( babelPath, repo );

  // Regex for extracting locale from file name.
  const localeRegex = /(?<=_)(.*)(?=.json)/;

  const stringFiles = [];
  try {
    const paths: string[] = fs.readdirSync( babelRepoPath );
    stringFiles.push( ...paths.map( p => path.join( babelRepoPath, p ) ) );
  }
  catch( e ) {

    // no translations found in babel. But we still must continue in order to generate an (albeit empty) string file.
  }

  const englishStringPath = path.join( rootPath, repo, `${repo}-strings_en.json` );
  if ( fs.existsSync( englishStringPath ) ) {
    stringFiles.push( englishStringPath );
  }

  const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // Do not generate a file if no translations were found.
  if ( stringFiles.length > 0 ) {

    // For each string file in the repo subdirectory...
    for ( const stringFile of stringFiles ) {

      // Extract the locale.
      const join = stringFile.split( '\\' ).join( '/' );
      const localeMatches = join.substring( join.lastIndexOf( '/' ) ).match( localeRegex );
      assert( localeMatches );
      const locale = localeMatches[ 0 ];

      if ( !localeData[ locale ] ) {
        console.log( '[WARNING] Locale not found in localeData.json: ' + locale );
        continue;
      }

      // Get the contents of the string file.
      const stringFileContents = fs.readFileSync( stringFile, 'utf8' );

      // Parse the string file contents.
      const parsedStringFileContents = JSON.parse( stringFileContents );

      // Add only the values of the string file to the new conglomerate string file, and ignore other fields, such as
      // the history.
      const objectToAddToLocale: Record<string, object> = {};
      for ( const stringKey of Object.keys( parsedStringFileContents ) ) {
        objectToAddToLocale[ stringKey ] = {
          value: parsedStringFileContents[ stringKey ].value
        };
      }

      // Add the string values to the locale object of the conglomerate string object.
      conglomerateStringObject[ locale ] = objectToAddToLocale;
    }

    // Make sure the output directory exists.  The name starts with an underscore so that it appears alphabetically
    // first and looks different from the repo names.
    const outputDir = path.join( babelPath, '_generated_development_strings' );
    try {
      fs.mkdirSync( outputDir );
    }
    catch( e ) {
      // already exists
    }

    const outputPath = path.join( outputDir, conglomerateStringFileName );
    fs.writeFileSync( outputPath, fixEOL( JSON.stringify( conglomerateStringObject, null, 2 ) ) );

    const end = Date.now();
    console.log( 'Wrote ' + outputPath + ' in ' + ( end - start ) + 'ms' );
  }
  else {
    console.log( 'no translations found' );
  }
};