// Copyright 2019, University of Colorado Boulder

/* eslint-disable */

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const execute = require( './execute' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const modulifyFile = async ( abspath, rootdir, subdir, filename ) => {
  if ( subdir && ( subdir.startsWith( 'images' ) || subdir.startsWith( 'phet/images' ) ) ) { // for brand
    if ( filename.endsWith( '.png' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `
var img = new Image();
window.phetImages = window.phetImages || [];
window.phetImages.push(img);
img.src='${x}';
export default img;
`;

      const outputFilename = replace( abspath, '.png', '_png.js' );
      fs.writeFileSync( outputFilename, contents );
    }
  }
  if ( subdir && ( subdir.startsWith( 'sounds' ) ) ) {
    if ( filename.endsWith( '.mp3' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.mp3', '_mp3.js' );
      fs.writeFileSync( outputFilename, contents );
    }
    if ( filename.endsWith( '.wav' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.wav', '_wav.js' );
      fs.writeFileSync( outputFilename, contents );
    }
  }
};

const bundleStrings = repo => {
  try {
    const englishStringsString = grunt.file.read( `../${repo}/${repo}-strings_en.json` ); // the english strings file
    const englishStringsJSON = JSON.parse( englishStringsString );
    console.log( englishStringsJSON );
    const stringsObject = {
      en: englishStringsJSON // TODO: embed all strings in this file?  Do we support modes where not all strings are built-in? https://github.com/phetsims/chipper/issues/820
    };
    const sourceCode = `export default ${JSON.stringify( stringsObject, null, 2 )}`;
    fs.writeFileSync( `../${repo}/${repo}-strings.js`, sourceCode );
  }
  catch( e ) {
    console.log( 'string problem for ' + repo );
  }
};

module.exports = async function( repo, cache ) {

  // Run a subset for fast iteration.
  let myrepos = [ 'acid-base-solutions', 'tambo', 'scenery-phet', 'joist', 'brand' ];
  for ( const repo of myrepos ) {
    console.log( repo );
    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
      modulifyFile( abspath, rootdir, subdir, filename );
    } );
    bundleStrings( repo );
  }
};