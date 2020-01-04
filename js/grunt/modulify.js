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
const buildMipmaps = require( '../grunt/buildMipmaps' );

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const modulifyFile = async ( abspath, rootdir, subdir, filename ) => {
  if ( subdir && ( subdir.startsWith( 'images' ) || subdir.startsWith( 'phet/images' ) ) ) { // for brand
    if ( filename.endsWith( '.png' ) ) {
      const x = loadFileAsDataURI( abspath );
      const source = x;

      const contents = `
var img = new Image();
window.phetImages = window.phetImages || [];
window.phetImages.push(img);
img.src='${x}';
export default img;
`;

      const outputFilename = replace( abspath, '.png', '_png.js' );
      fs.writeFileSync( outputFilename, contents );

      /*
TODO: use mipmap plugin
       */

      const mipmapContents = `
var img = new Image();
window.phetImages = window.phetImages || [];
window.phetImages.push(img);
img.src='${x}';
const m = {
  img: img,
  width: 100,
  height:100,
  canvas: document.createElement('canvas'),
};
m.canvas.width = 100;
m.canvas.height = 100;
var context = m.canvas.getContext('2d');
m.updateCanvas = ()=>{
  if (m.img.complete && ( typeof m.img.naturalWidth === 'undefined' || m.img.naturalWidth > 0 ) ) {
  context.drawImage(m.img,0,0);
  delete m.updateCanvas;
  }
}

export default [m];
`;

      const mipmapFilename = replace( abspath, '.png', '_png_mipmap.js' );
      fs.writeFileSync( mipmapFilename, mipmapContents ); // https://github.com/phetsims/chipper/issues/820 TODO: mipmap
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
    // console.log( englishStringsJSON );
    const stringsObject = {
      en: englishStringsJSON // TODO: embed all strings in this file?  Do we support modes where not all strings are built-in? https://github.com/phetsims/chipper/issues/820
    };
    const sourceCode =
      `import LocalizedStringBundle from '../chipper/js/webpack/LocalizedStringBundle';
export default new LocalizedStringBundle(${JSON.stringify( stringsObject, null, 2 )});
`
    fs.writeFileSync( `../${repo}/${repo}-strings.js`, sourceCode );
  }
  catch( e ) {
    console.log( 'string problem for ' + repo );
  }
};

module.exports = async function( repo, cache ) {

  // Run a subset for fast iteration.
  let myrepos = [ 'acid-base-solutions', 'joist', 'brand', 'scenery-phet' ];
  for ( const repo of myrepos ) {
    console.log( repo );
    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, async ( abspath, rootdir, subdir, filename ) => {
      await modulifyFile( abspath, rootdir, subdir, filename );
    } );
    bundleStrings( repo );
  }
};