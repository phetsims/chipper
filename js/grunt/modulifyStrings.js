// Copyright 2019, University of Colorado Boulder

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );
const grunt = require( 'grunt' );

// TODO: query strings for string tests

// disable lint in compiled files
const HEADER = '/* eslint-disable */';

/**
 * For a given repo, create the string files, if any.
 * @param {string} repo - lowercase repo name
 */
const modulifyStrings = repo => {

  let englishStringsString = null;
  try {

    // Load the primary english string file
    englishStringsString = grunt.file.read( `../${repo}/${repo}-strings_en.json` ); // the english strings file
  }
  catch( e ) {
    return;
  }
  const englishStringsJSON = JSON.parse( englishStringsString );

  // read from babel, if it has any translations.  Key = locale, value = translation file
  const translatedStringsMap = {};

  try {
    const results = fs.readdirSync( `../babel/${repo}` );

    // read each file once
    results.forEach( result => {
      const locale = result.substring( result.indexOf( '_' ) + 1, result.lastIndexOf( '.json' ) );
      const contents = grunt.file.read( `../babel/${repo}/${result}` );
      translatedStringsMap[ locale ] = JSON.parse( contents );
    } );
  }
  catch( e ) {

    // no babel translations yet, probably
  }

  try {
    fs.mkdirSync( `../${repo}/strings/` );
  }
  catch( e ) {

    // maybe that directory already existed?
  }

  const traverse = ( parent, visitor, path = [] ) => {
    Object.keys( parent ).forEach( key => {
      const value = parent[ key ];
      const newPath = path.concat( [ key ] );
      if ( value.hasOwnProperty( 'value' ) ) { // signifies a string value
        visitor( value, newPath.join( '.' ) );
      }
      if ( typeof value === 'object' ) { // traverse deeper
        traverse( value, visitor, newPath );
      }
    } );
  };

  // TODO: traverse nested substructure for structured strings
  traverse( englishStringsJSON, ( value, key ) => {

    const stringsObject = {
      en: _.at( englishStringsJSON, key )[ 0 ]
    };
    Object.keys( translatedStringsMap ).forEach( locale => {
      const translatedStrings = translatedStringsMap[ locale ];

      const translatedStringEntry = translatedStrings[ key ]; // babel files do not support structuring
      if ( translatedStringEntry ) {
        stringsObject[ locale ] = translatedStringEntry; // value plucked out later
      }
    } );

    // Pluck out the values to streamline the file
    const o = _.mapValues( stringsObject, 'value' );

    // Output one string file per string key
    const stringSourceCode = `${HEADER}
const values = ${JSON.stringify( o, null, 2 )};
export default values[window.phet.chipper.locale] || values.en; // fallback to English if no locale specified, or if there is no string for that file
`;

    fs.writeFileSync( `../${repo}/strings/${key}.js`, stringSourceCode );
  } );
  Object.keys( englishStringsJSON ).forEach( key => {

  } );
};

module.exports = modulifyStrings;