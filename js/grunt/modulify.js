// Copyright 2020, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const createMipmap = require( './createMipmap' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );
const os = require( 'os' );
const updateCopyrightForGeneratedFile = require( './updateCopyrightForGeneratedFile' );

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

  fs.writeFileSync( convertSuffix( abspath, '.js' ), fixEOL( contents ) );
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
const onDecodeSuccess = decodedAudio => {
  wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
  unlock();
};
const onDecodeError = decodeError => {
  console.warn( 'decode of audio data failed, using stubbed sound, error: ' + decodeError );
  wrappedAudioBuffer.audioBufferProperty.set( phetAudioContext.createBuffer( 1, 0, phetAudioContext.sampleRate ) );
  unlock();
};
phetAudioContext.decodeAudioData( soundByteArray.buffer, onDecodeSuccess, onDecodeError );
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
  const stringModuleFile = `../${repo}/js/${_.camelCase( repo )}Strings.js`;
  const namespace = _.camelCase( repo );
  fs.writeFileSync( stringModuleFile, fixEOL( `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getStringModule from '../../chipper/js/getStringModule.js';
import ${namespace} from './${namespace}.js';

const ${namespace}Strings = getStringModule( '${packageObject.phet.requirejsNamespace}' );

${namespace}.register( '${namespace}Strings', ${namespace}Strings );

export default ${namespace}Strings;
` ) );
  await updateCopyrightForGeneratedFile( repo, stringModuleFile );
};

/**
 * Creates the namespace module at js/${_.camelCase( repo )}.js for repos that need it.
 * @public
 *
 * @param {string} repo
 */
const createNamespaceModule = async repo => {
  const namespace = _.camelCase( repo );
  const namespaceFile = `../${repo}/js/${namespace}.js`;
  fs.writeFileSync( namespaceFile, fixEOL( `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder

/**
 * Creates the namespace for this simulation.
 */

// modules
import Namespace from '../../phet-core/js/Namespace.js';

export default new Namespace( '${namespace}' );
` ) );
  await updateCopyrightForGeneratedFile( repo, namespaceFile );
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

  // Create the namespace file, if it did not already exist
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  if ( fs.existsSync( `../${repo}/${repo}-strings_en.json` ) && packageObject.phet && packageObject.phet.requirejsNamespace ) {
    await createStringModule( repo );

    const namespace = _.camelCase( repo );
    const namespaceFile = `../${repo}/js/${namespace}.js`;
    if ( !fs.existsSync( namespaceFile ) ) {
      await createNamespaceModule( repo );
    }
  }
};

module.exports = modulify;