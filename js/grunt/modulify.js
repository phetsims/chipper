// Copyright 2019, University of Colorado Boulder

/* eslint-disable */

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const createMipmap = require( './createMipmap' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );
const updateCopyrightForGeneratedFile = require( './updateCopyrightForGeneratedFile' );

// disable lint in compiled files
const HEADER = '/* eslint-disable */';

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const modulifyFile = async ( abspath, rootdir, subdir, filename ) => {
  if ( subdir && ( subdir.startsWith( 'images' ) || subdir.startsWith( 'phet/images' ) ) ) { // for brand
    if ( filename.endsWith( '.png' ) ) { // TODO: JPEGs
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
var img = new Image();
window.phetImages = window.phetImages || [];
window.phetImages.push(img);
img.src='${x}';
export default img;
`;

      const outputFilename = replace( abspath, '.png', '_png.js' );
      fs.writeFileSync( outputFilename, contents );

      // defaults.  TODO: do we need to support non-defaults?  See https://github.com/phetsims/chipper/issues/820
      const options = {
        level: 4, // maximum level
        quality: 98
      };

      try {
        const mipmaps = await createMipmap( abspath, options.level, options.quality );
        const entry = mipmaps.map( ( { width, height, url } ) => ( { width: width, height: height, url: url } ) );

        const mipmapContents = `${HEADER}
var mipmaps = ${JSON.stringify( entry )};
window.phetImages = window.phetImages || [] // ensure reference
mipmaps.forEach( function( mipmap ) {
  mipmap.img = new Image();
  window.phetImages.push( mipmap.img ); // make sure it's loaded before the sim launches
  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level
  mipmap.canvas = document.createElement( 'canvas' );
  mipmap.canvas.width = mipmap.width;
  mipmap.canvas.height = mipmap.height;
  var context = mipmap.canvas.getContext( '2d' );
  mipmap.updateCanvas = function() {
    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {
      context.drawImage( mipmap.img, 0, 0 );
      delete mipmap.updateCanvas;
    }
  };
} );
export default mipmaps;
      `;


        const mipmapFilename = replace( abspath, '.png', '_png_mipmap.js' );
        fs.writeFileSync( mipmapFilename, mipmapContents );
      }
      catch( e ) {
        console.log( `Image could not be mipmapped: ${abspath}` );
      }
    }
  }
  if ( subdir && ( subdir.startsWith( 'sounds' ) ) ) {
    if ( filename.endsWith( '.mp3' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.mp3', '_mp3.js' );
      fs.writeFileSync( outputFilename, contents );
    }
    if ( filename.endsWith( '.wav' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.wav', '_wav.js' );
      fs.writeFileSync( outputFilename, contents );
    }
  }
};

module.exports = async function( repo ) {
  console.log( `modulifying ${repo}` );
  const relativeFiles = [];
  grunt.file.recurse( `../${repo}`, async ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( { abspath: abspath, rootdir: rootdir, subdir: subdir, filename: filename } );
  } );

  for ( let entry of relativeFiles ) {
    await modulifyFile( entry.abspath, entry.rootdir, entry.subdir, entry.filename );
  }

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) && packageObject.phet && packageObject.phet.requirejsNamespace ) {
    const stringModuleFile = `../${repo}/js/${repo}-strings.js`;
    const namespace = _.camelCase( repo );
    fs.writeFileSync( stringModuleFile, `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder

import getStringModule from '../../chipper/js/getStringModule.js';
import ${namespace} from './${namespace}.js';

const ${namespace}Strings = getStringModule( '${packageObject.phet.requirejsNamespace}' );

${namespace}.register( '${namespace}Strings', ${namespace}Strings );

export default ${namespace}Strings;
` );
    await updateCopyrightForGeneratedFile( repo, stringModuleFile );

    const namespaceFile = `../${repo}/js/${namespace}.js`;
    if ( !fs.existsSync( namespaceFile ) ) {
      fs.writeFileSync( namespaceFile, `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder

/**
 * Creates the namespace for this simulation.
 */

// modules
import Namespace from '../../phet-core/js/Namespace.js';

export default new Namespace( '${namespace}' );
` );
      await updateCopyrightForGeneratedFile( repo, namespaceFile );
    }
  }
};