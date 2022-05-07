// Copyright 2020-2022, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */


const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const createMipmap = require( './createMipmap' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );
const os = require( 'os' );
const getCopyrightLine = require( './getCopyrightLine' );

// disable lint in compiled files, because it increases the linting time
const HEADER = '/* eslint-disable */';

// supported image types, not case-sensitive
const IMAGE_SUFFIXES = [ '.png', '.jpg', '.cur' ];

// supported sound file types, not case-sensitive
const SOUND_SUFFIXES = [ '.mp3', '.wav' ];

/**
 * String replacement
 * @param {string} string - the string which will be searched
 * @param {string} search - the text to be replaced
 * @param {string} replacement - the new text
 * @returns {string}
 */
const replace = ( string, search, replacement ) => string.split( search ).join( replacement );

/**
 * Gets the relative path to the root based on the depth of a resource
 *
 * @returns {string}
 */
const expandDots = abspath => {

  // Finds the depths of a directory relative to the root of where grunt.recurse was called from (a repo root)
  const depth = abspath.split( '/' ).length - 2;
  let parentDirectory = '';
  for ( let i = 0; i < depth; i++ ) {
    parentDirectory = `${parentDirectory}../`;
  }
  return parentDirectory;
};

/**
 * Output with an OS-specific EOL sequence, see https://github.com/phetsims/chipper/issues/908
 * @param string
 * @returns {string}
 */
const fixEOL = string => replace( string, '\n', os.EOL );

/**
 * Transform an image file to a JS file that loads the image.
 * @param {string} abspath - the absolute path of the image
 */
const modulifyImage = async abspath => {

  const dataURI = loadFileAsDataURI( abspath );

  const contents = `${HEADER}
import asyncLoader from '${expandDots( abspath )}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = '${dataURI}';
export default image;`;

  const tsFilePath = convertSuffix( abspath, '.ts' );
  fs.writeFileSync( tsFilePath, fixEOL( contents ) );
};

/**
 * Transform an image file to a JS file that loads the image as a mipmap.
 * @param {string} abspath - the absolute path of the image
 */
const modulifyMipmap = async abspath => {

  // Defaults. NOTE: using the default settings because we have not run into a need, see
  // https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/945
  const config = {
    level: 4, // maximum level
    quality: 98
  };

  const mipmaps = await createMipmap( abspath, config.level, config.quality );
  const entry = mipmaps.map( ( { width, height, url } ) => ( { width: width, height: height, url: url } ) );

  const mipmapContents = `${HEADER}
import asyncLoader from '${expandDots( abspath )}phet-core/js/asyncLoader.js';

const mipmaps = ${JSON.stringify( entry, null, 2 )};
mipmaps.forEach( mipmap => {
  mipmap.img = new Image();
  const unlock = asyncLoader.createLock( mipmap.img );
  mipmap.img.onload = unlock;
  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level
  mipmap.canvas = document.createElement( 'canvas' );
  mipmap.canvas.width = mipmap.width;
  mipmap.canvas.height = mipmap.height;
  const context = mipmap.canvas.getContext( '2d' );
  mipmap.updateCanvas = () => {
    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {
      context.drawImage( mipmap.img, 0, 0 );
      delete mipmap.updateCanvas;
    }
  };
} );
export default mipmaps;`;
  fs.writeFileSync( convertSuffix( abspath, '.js' ), fixEOL( mipmapContents ) );
};

/**
 * Decode a sound file into a Web Audio AudioBuffer.
 * @param {string} abspath - the absolute path of the sound file
 */
const modulifySound = abspath => {

  // load the sound file
  const dataURI = loadFileAsDataURI( abspath );

  // output the contents of the file that will define the sound in JS format
  const contents = `${HEADER}
import asyncLoader from '${expandDots( abspath )}phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '${expandDots( abspath )}tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '${expandDots( abspath )}tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '${expandDots( abspath )}tambo/js/phetAudioContext.js';

const soundURI = '${dataURI}';
const soundByteArray = base64SoundToByteArray( phetAudioContext, soundURI );
const unlock = asyncLoader.createLock( soundURI );
const wrappedAudioBuffer = new WrappedAudioBuffer();

// safe way to unlock
let unlocked = false;
const safeUnlock = () => {
  if ( !unlocked ) {
    unlock();
    unlocked = true;
  }
};

const onDecodeSuccess = decodedAudio => {
  if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
    wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
    safeUnlock();
  }
};
const onDecodeError = decodeError => {
  console.warn( 'decode of audio data failed, using stubbed sound, error: ' + decodeError );
  wrappedAudioBuffer.audioBufferProperty.set( phetAudioContext.createBuffer( 1, 1, phetAudioContext.sampleRate ) );
  safeUnlock();
};
const decodePromise = phetAudioContext.decodeAudioData( soundByteArray.buffer, onDecodeSuccess, onDecodeError );
if ( decodePromise ) {
  decodePromise
    .then( decodedAudio => {
      if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
        wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
        safeUnlock();
      }
    } )
    .catch( e => {
      console.warn( 'promise rejection caught for audio decode, error = ' + e );
      safeUnlock();
    } );
}
export default wrappedAudioBuffer;`;

  fs.writeFileSync( convertSuffix( abspath, '.js' ), fixEOL( contents ) );
};

/**
 * Convert .png => _png_mipmap.js, etc.
 *
 * @param {string} abspath - the absolute path
 * @param {string} suffix - the new suffix, such as '.js'
 * @returns {string}
 */
const convertSuffix = ( abspath, suffix ) => {
  const lastDotIndex = abspath.lastIndexOf( '.' );
  return `${abspath.substring( 0, lastDotIndex )}_${abspath.substring( lastDotIndex + 1 )}${suffix}`;
};

/**
 * Determines the suffix from a filename, everything after the final '.'
 *
 * @param {string} filename
 * @returns {string}
 */
const getSuffix = filename => {
  const index = filename.lastIndexOf( '.' );
  return filename.substring( index );
};

/**
 * Creates a *.js file corresponding to matching resources such as images or sounds.
 * @param {string} abspath
 * @param {string} rootdir
 * @param {string} subdir
 * @param {string} filename
 */
const modulifyFile = async ( abspath, rootdir, subdir, filename ) => {

  if ( subdir && ( subdir.startsWith( 'images' ) ||

                   // for brand
                   subdir.startsWith( 'phet/images' ) ||
                   subdir.startsWith( 'phet-io/images' ) ||
                   subdir.startsWith( 'adapted-from-phet/images' ) )
       && IMAGE_SUFFIXES.indexOf( getSuffix( filename ) ) >= 0 ) {
    await modulifyImage( abspath );
  }

  if ( subdir && ( subdir.startsWith( 'mipmaps' ) ||

                   // for brand
                   subdir.startsWith( 'phet/mipmaps' ) ||
                   subdir.startsWith( 'phet-io/mipmaps' ) ||
                   subdir.startsWith( 'adapted-from-phet/mipmaps' ) )
       && IMAGE_SUFFIXES.indexOf( getSuffix( filename ) ) >= 0 ) {
    await modulifyMipmap( abspath );
  }

  if ( subdir && subdir.startsWith( 'sounds' ) && SOUND_SUFFIXES.indexOf( getSuffix( filename ) ) >= 0 ) {
    await modulifySound( abspath );
  }
};

/**
 * Creates the string module at js/${_.camelCase( repo )}Strings.js for repos that need it.
 * @public
 *
 * @param {string} repo
 */
const createStringModule = async repo => {

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const stringModuleFileJS = `../${repo}/js/${_.camelCase( repo )}Strings.js`;
  const stringModuleFileTS = `../${repo}/js/${_.camelCase( repo )}Strings.ts`;
  const namespace = _.camelCase( repo );

  if ( fs.existsSync( stringModuleFileJS ) ) {
    console.log( 'Found JS string file in TS repo.  It should be deleted manually.  ' + stringModuleFileJS );
  }

  const copyrightLine = await getCopyrightLine( repo, `js/${_.camelCase( repo )}Strings.ts` );
  fs.writeFileSync( stringModuleFileTS, fixEOL(
    `${copyrightLine}

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
/* eslint-disable */
import getStringModule from '../../chipper/js/getStringModule.js';
import ${namespace} from './${namespace}.js';

type StringsType = ${getStringTypes( repo )};

const ${namespace}Strings = getStringModule( '${packageObject.phet.requirejsNamespace}' ) as StringsType;

${namespace}.register( '${namespace}Strings', ${namespace}Strings );

export default ${namespace}Strings;
` ) );
};

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 * @public
 *
 * @param {string} repo
 */
const getStringTypes = repo => {
  const json = grunt.file.readJSON( `../${repo}/${repo}-strings_en.json` );

  // Track paths to all the keys with values.
  const all = [];

  // Recursively collect all of the paths to keys with values.
  const visit = ( level, path ) => {
    Object.keys( level ).forEach( key => {
      if ( key !== '_comment' ) {
        if ( level[ key ].value && typeof level[ key ].value === 'string' ) {
          all.push( { path: [ ...path, key ], value: level[ key ].value } );
        }
        else {
          visit( level[ key ], [ ...path, key ] );
        }
      }
    } );
  };
  visit( json, [] );

  // Transform to a new structure that matches the types we access at runtime.
  const structure = {};
  for ( let i = 0; i < all.length; i++ ) {
    const allElement = all[ i ];
    const path = allElement.path;
    let level = structure;
    for ( let k = 0; k < path.length; k++ ) {
      const pathElement = path[ k ];
      const tokens = pathElement.split( '.' );
      for ( let m = 0; m < tokens.length; m++ ) {
        const token = tokens[ m ];
        if ( k === path.length - 1 && m === tokens.length - 1 ) {
          level[ token ] = '{{STRING}}'; // instead of value = allElement.value
        }
        else {
          level[ token ] = level[ token ] || {};
          level = level[ token ];
        }
      }
    }
  }

  let text = JSON.stringify( structure, null, 2 );

  // Use single quotes instead of the double quotes from JSON
  text = replace( text, '"', '\'' );

  text = replace( text, '\'{{STRING}}\'', 'string' );

  // Add ; to the last in the list
  text = replace( text, ': string\n', ': string;\n' );

  // Use ; instead of ,
  text = replace( text, ',', ';' );

  return text;
};

/**
 * Entry point for modulify, which transforms all of the resources in a repo to *.js files.
 * @param {string} repo - the name of a repo, such as 'joist'
 */
const modulify = async repo => {
  console.log( `modulifying ${repo}` );
  const relativeFiles = [];
  grunt.file.recurse( `../${repo}`, async ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( { abspath: abspath, rootdir: rootdir, subdir: subdir, filename: filename } );
  } );

  for ( let i = 0; i < relativeFiles.length; i++ ) {
    const entry = relativeFiles[ i ];
    await modulifyFile( entry.abspath, entry.rootdir, entry.subdir, entry.filename );
  }


  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) && packageObject.phet && packageObject.phet.requirejsNamespace ) {

    // Update the strings module file
    await createStringModule( repo );
  }
};

module.exports = modulify;