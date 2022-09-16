// Copyright 2022, University of Colorado Boulder

/**
 * This script makes a JSON file that combines translations for all locales in a repo. Each locale object has every string
 * key / translated value pair we have for that locale. Used in running the unbuilt mode simulation with locales=*
 *
 * @author Liam Mulhall (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// imports
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * @param {string} repo - repo to generate strings for
 */
module.exports = repo => {

  const start = Date.now();

  // OS-independent path to babel repo.
  const babelPath = path.join( __dirname, '..', '..', '..', 'babel' );

  // Create a file name for the conglomerate string file.
  const conglomerateStringFileName = `${repo}_all.json`;

  // Create an empty object for the conglomerate string file that we will add to later.
  const conglomerateStringObject = {};

  // Get an array of files (string files) in the repo subdirectory.
  const filePath = path.join( babelPath, repo );

  // Regex for extracting locale from file name.
  const localeRegex = /(?<=_)(.*)(?=.json)/;

  let stringFiles;
  try {
    stringFiles = fs.readdirSync( filePath );
  }
  catch( e ) {

    // no translations found
  }

  // Do not generate a file if no translations were found
  if ( stringFiles ) {

    // For each string file in the repo subdirectory...
    for ( const stringFile of stringFiles ) {

      // Extract the locale.
      const localeMatches = stringFile.match( localeRegex );
      const locale = localeMatches[ 0 ];

      // Get the contents of the string file.
      const stringFilePath = path.join( filePath, stringFile );
      const stringFileContents = fs.readFileSync( stringFilePath, 'utf8' );

      // Parse the string file contents.
      const parsedStringFileContents = JSON.parse( stringFileContents );

      // Add only the values of the string file to the new conglomerate string file.
      // That is, we ignore the string key's history.
      const objectToAddToLocale = {};
      for ( const stringKey of Object.keys( parsedStringFileContents ) ) {
        objectToAddToLocale[ stringKey ] = {
          value: parsedStringFileContents[ stringKey ].value
        };
      }

      // Add the string file contents minus the history to the locale object of the conglomerate string object.
      conglomerateStringObject[ locale ] = objectToAddToLocale;
    }

    // Underscore so it appears alphabetically first and looks different than the repo names
    const outputDir = path.join( babelPath, '_generated' );
    try {
      fs.mkdirSync( outputDir );
    }
    catch( e ) {
      // already exists
    }

    const outputPath = path.join( outputDir, conglomerateStringFileName );
    fs.writeFileSync( outputPath, JSON.stringify( conglomerateStringObject, null, 2 ) );

    const end = Date.now();
    console.log( 'Wrote ' + outputPath + ' in ' + ( end - start ) + 'ms' );
  }
  else {

    console.log( 'no translations found' );
  }
};