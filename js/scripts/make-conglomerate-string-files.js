// Copyright 2022, University of Colorado Boulder

/**
 * This script makes JSON files that contain all translated values of every string key for a given repo.
 *
 * @author Liam Mulhall
 */

// imports
const fs = require( 'fs' );
const path = require( 'path' );

( () => {
  try {

    // OS-independent path to babel repo.
    const babelPath = path.join( __dirname, '..', '..', '..', 'babel' );

    // Array of files (mostly subdirectories whose names are repos) in the babel repo.
    const babelFiles = fs.readdirSync( babelPath );

    // We don't care about these files for the purposes of this script.
    const babelFilesToIgnore = [ '.git', '.gitignore', 'LICENSE', 'README.md' ];
    const babelFilesToIterateThrough = babelFiles.filter( file => !babelFilesToIgnore.includes( file ) );

    // For each file (i.e. each repo subdirectory) in the babel repo...
    for ( const file of babelFilesToIterateThrough ) {

      // Create a file name for the conglomerate string file.
      const conglomerateStringFileName = `${file}_all_locales_strings.json`;

      // Create an empty object for the conglomerate string file that we will add to later.
      const conglomerateStringObject = {};

      // Get an array of files (string files) in the repo subdirectory.
      const filePath = path.join( babelPath, file );
      const stringFiles = fs.readdirSync( filePath );

      // Regex for extracting locale from file name.
      const localeRegex = /(?<=_)(.*)(?=.json)/;

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
        // That is, we ignore the history of the string file.
        const objectToAddToLocale = {};
        for ( const stringKey of Object.keys( parsedStringFileContents ) ) {
          objectToAddToLocale[ stringKey ] = {
            value: parsedStringFileContents[ stringKey ].value
          };
        }

        // Add the string file contents minus the history to the locale object of the conglomerate string object.
        conglomerateStringObject[ locale ] = objectToAddToLocale;
      }

      // TODO: Remove when done.
      if ( conglomerateStringFileName === 'acid-base-solutions_all_locales_strings.json' ) {
        const outputPath = path.join( __dirname, '..', '..', 'dist', 'strings', conglomerateStringFileName );
        fs.writeFileSync( outputPath, JSON.stringify( conglomerateStringObject, null, 2 ) );
        return;
      }
    }
  }
  catch( e ) {
    console.error( e );
  }
} )();