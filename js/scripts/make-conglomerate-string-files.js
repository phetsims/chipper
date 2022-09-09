// Copyright 2022, University of Colorado Boulder

/**
 * TODO: Complete documentation when done.
 * This script makes JSON files that contain ...
 *
 * Requirements:
 * - one file for each subdirectory in phetsims/babel
 * - for each file, one locale key for each string file in the subdirectory
 * - for each locale key, contents of string file
 * - output to chipper/dist/strings
 *
 * @author Liam Mulhall
 */

const fs = require( 'fs' );
const path = require( 'path' );

( () => {
  const babelPath = path.join( __dirname, '..', '..', '..', 'babel' );
  const babelFiles = fs.readdirSync( babelPath );
  const babelFilesToIgnore = [ '.git', '.gitignore', 'LICENSE', 'README.md' ];
  const babelFilesToIterateThrough = babelFiles.filter( file => !babelFilesToIgnore.includes( file ) );
  for ( const file of babelFilesToIterateThrough ) {

    const conglomerateStringFileName = `${file}_all_locales_strings.json`;
    const conglomerateStringObject = {};

    const filePath = path.join( babelPath, file );
    const stringFiles = fs.readdirSync( filePath );

    const localeRegex = /(?<=_)(.*)(?=.json)/;
    for ( const stringFile of stringFiles ) {
      const localeMatches = stringFile.match( localeRegex );
      const locale = localeMatches[ 0 ];

      const stringFilePath = path.join( filePath, stringFile );
      const stringFileContents = fs.readFileSync( stringFilePath, 'utf8' );
      const parsedStringFileContents = JSON.parse( stringFileContents );
      const objectToAddToLocale = {};
      for ( const stringKey of Object.keys( parsedStringFileContents ) ) {
        objectToAddToLocale[ stringKey ] = {
          value: parsedStringFileContents[ stringKey ].value
        };
      }
      conglomerateStringObject[ locale ] = objectToAddToLocale;
    }

    // TODO: Remove when done.
    if ( conglomerateStringFileName === 'acid-base-solutions_all_locales_strings.json' ) {
      const outputPath = path.join( __dirname, '..', '..', 'dist', 'strings', conglomerateStringFileName );
      fs.writeFileSync( outputPath, JSON.stringify( conglomerateStringObject, null, 2 ) );
      return;
    }
  }
} )();