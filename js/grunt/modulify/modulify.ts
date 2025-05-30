// Copyright 2020-2025, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fs, { readFileSync } from 'fs';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import loadFileAsDataURI from '../../common/loadFileAsDataURI.js';
import pascalCase from '../../common/pascalCase.js';
import toLessEscapedString from '../../common/toLessEscapedString.js';
import createMipmap from '../createMipmap.js';
import generateDevelopmentStrings from '../generateDevelopmentStrings.js';
import getCopyrightLine from '../getCopyrightLine.js';
import convertStringsYamlToJson from './convertStringsYamlToJson.js';
import createStringModule from './createStringModule.js';
import generateFluentTypes from './generateFluentTypes.js';
import modulifyFluentFile from './modulifyFluentFile.js';

const svgo = require( 'svgo' );

const OFF = 'off';

// disable lint in compiled files, because it increases the linting time
const HEADER = '/* eslint-disable */\n/* @formatter:' + OFF + ' */\n';

// supported image types, not case-sensitive
const IMAGE_SUFFIXES = [ '.png', '.jpg', '.cur', '.svg' ];

const SVG_SUFFIXES = [ '.svg' ];
const OTHER_IMAGE_SUFFIXES = IMAGE_SUFFIXES.filter( suffix => !SVG_SUFFIXES.includes( suffix ) );

// supported sound file types, not case-sensitive
const SOUND_SUFFIXES = [ '.mp3', '.wav' ];

/**
 * String replacement
 * @param string - the string which will be searched
 * @param search - the text to be replaced
 * @param replacement - the new text
 */
export const replace = ( string: string, search: string, replacement: string ): string => string.split( search ).join( replacement );

/**
 * Gets the relative path to the root based on the depth of a resource
 */
const expandDots = ( relativePath: string ): string => {

  relativePath = relativePath.replaceAll( '\\', '/' ); // Normalize the path to use forward slashes

  // Finds the depths of a directory relative to the root of where grunt.recurse was called from (a repo root)
  const depth = relativePath.split( '/' ).length;
  let parentDirectory = '';
  for ( let i = 0; i < depth; i++ ) {
    parentDirectory = `${parentDirectory}../`;
  }
  return parentDirectory;
};

/**
 * Output with an OS-specific EOL sequence, see https://github.com/phetsims/chipper/issues/908
 */
export const fixEOL = ( string: string ): string => replace( string, '\n', os.EOL );

/**
 * Transform an image file to a JS file that loads the image.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the image file
 */
const modulifyImage = async ( repo: string, relativePath: string ) => {

  const abspath = path.resolve( `../${repo}`, relativePath );
  const dataURI = loadFileAsDataURI( abspath );

  const contents = `${HEADER}
import asyncLoader from '${expandDots( relativePath )}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = '${dataURI}';
export default image;`;

  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, fixEOL( contents ) );
};

/**
 * Transform an SVG image file to a JS file that loads the image.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the SVG file
 */
const modulifySVG = async ( repo: string, relativePath: string ) => {

  const abspath = path.resolve( `../${repo}`, relativePath );
  const fileContents = fs.readFileSync( abspath, 'utf-8' );

  if ( !fileContents.includes( 'width="' ) || !fileContents.includes( 'height="' ) ) {
    throw new Error( `SVG file ${abspath} does not contain width and height attributes` );
  }

  // Use SVGO to optimize the SVG contents, see https://github.com/phetsims/arithmetic/issues/201
  const optimizedContents = svgo.optimize( fileContents, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // We can't scale things and get the right bounds if the view box is removed.
            removeViewBox: false
          }
        }
      }
    ]
  } ).data;

  const contents = `${HEADER}
import asyncLoader from '${expandDots( relativePath )}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = \`data:image/svg+xml;base64,\${btoa(${toLessEscapedString( optimizedContents )})}\`;
export default image;`;

  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, fixEOL( contents ) );
};

/**
 * Transform an image file to a JS file that loads the image as a mipmap.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the image file
 */
const modulifyMipmap = async ( repo: string, relativePath: string ) => {

  // Defaults. NOTE: using the default settings because we have not run into a need, see
  // https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/945
  const config = {
    level: 4, // maximum level
    quality: 98
  };

  const abspath = path.resolve( `../${repo}`, relativePath );
  const mipmapLevels = await createMipmap( abspath, config.level, config.quality );
  const entries = mipmapLevels.map( ( { width, height, url } ) => `  new MipmapElement( ${width}, ${height}, '${url}' )` );

  const mipmapContents = `${HEADER}
import MipmapElement from '${expandDots( relativePath )}chipper/js/browser/MipmapElement.js';

// The levels in the mipmap. Specify explicit types rather than inferring to assist the type checker, for this boilerplate case.
const mipmaps = [
${entries.join( ',\n' )}
];

export default mipmaps;`;
  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, fixEOL( mipmapContents ) );
};

/**
 * Decode a sound file into a Web Audio AudioBuffer.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the sound file
 */
const modulifySound = async ( repo: string, relativePath: string ) => {

  const abspath = path.resolve( `../${repo}`, relativePath );

  // load the sound file
  const dataURI = loadFileAsDataURI( abspath );

  // output the contents of the file that will define the sound in JS format
  const contents = `${HEADER}
import asyncLoader from '${expandDots( relativePath )}phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '${expandDots( relativePath )}tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '${expandDots( relativePath )}tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '${expandDots( relativePath )}tambo/js/phetAudioContext.js';

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

  const jsFilename = convertSuffix( relativePath, '.js' );
  await writeFileAndGitAdd( repo, jsFilename, fixEOL( contents ) );
};

/**
 * Convert .png => _png_mipmap.js, etc.
 *
 * @param abspath - file name with a suffix or a path to it
 * @param suffix - the new suffix, such as '.js'
 */
const convertSuffix = ( abspath: string, suffix: string ) => {
  const lastDotIndex = abspath.lastIndexOf( '.' );
  return `${abspath.substring( 0, lastDotIndex )}_${abspath.substring( lastDotIndex + 1 )}${suffix}`;
};

/**
 * Determines the suffix from a filename, everything after the final '.'
 */
const getSuffix = ( filename: string ) => {
  const index = filename.lastIndexOf( '.' );
  return filename.substring( index );
};

/**
 * Creates the image module at js/${_.camelCase( repo )}Images.js for repos that need it.
 */
const createImageModule = async ( repo: string, supportedRegionsAndCultures: string[] ): Promise<void> => {
  const spec: Record<string, Record<string, string>> = JSON.parse( readFileSync( `../${repo}/${repo}-images.json`, 'utf8' ) );
  const namespace = _.camelCase( repo );
  const imageModuleName = `${pascalCase( repo )}Images`;
  const relativeImageModuleFile = `js/${imageModuleName}.ts`;

  const providedRegionsAndCultures = Object.keys( spec );

  // Ensure our regionAndCultures in the -images.json file match with the supportedRegionsAndCultures in the package.json
  supportedRegionsAndCultures.forEach( regionAndCulture => {
    if ( !providedRegionsAndCultures.includes( regionAndCulture ) ) {
      throw new Error( `regionAndCulture '${regionAndCulture}' is required, but not found in ${repo}-images.json` );
    }
  } );
  providedRegionsAndCultures.forEach( regionAndCulture => {
    if ( !supportedRegionsAndCultures.includes( regionAndCulture ) ) {
      throw new Error( `regionAndCulture '${regionAndCulture}' is not supported, but found in ${repo}-images.json` );
    }
  } );

  const imageNames: string[] = _.uniq( providedRegionsAndCultures.flatMap( regionAndCulture => {
    return Object.keys( spec[ regionAndCulture ] );
  } ) ).sort();

  const imageFiles: string[] = _.uniq( providedRegionsAndCultures.flatMap( regionAndCulture => {
    return Object.values( spec[ regionAndCulture ] );
  } ) ).sort();

  // Do images exist?
  imageFiles.forEach( imageFile => {
    if ( !fs.existsSync( `../${repo}/${imageFile}` ) ) {
      throw new Error( `Image file ${imageFile} is referenced in ${repo}-images.json, but does not exist` );
    }
  } );

  // Ensure that all image names are provided for all regionAndCultures
  providedRegionsAndCultures.forEach( regionAndCulture => {
    imageNames.forEach( imageName => {
      if ( !spec[ regionAndCulture ].hasOwnProperty( imageName ) ) {
        throw new Error( `Image name ${imageName} is not provided for regionAndCulture ${regionAndCulture} (but provided for others)` );
      }
    } );
  } );

  const getImportName = ( imageFile: string ) => path.basename( imageFile, path.extname( imageFile ) );

  // Check that import names are unique
  // NOTE: we could disambiguate in the future in an automated way fairly easily, but should it be done?
  if ( _.uniq( imageFiles.map( getImportName ) ).length !== imageFiles.length ) {
    // Find and report the name collision
    const importNames = imageFiles.map( getImportName );
    const duplicates = importNames.filter( ( name, index ) => importNames.indexOf( name ) !== index );
    if ( duplicates.length ) { // sanity check!
      const firstDuplicate = duplicates[ 0 ];
      const originalNames = imageFiles.filter( imageFile => getImportName( imageFile ) === firstDuplicate );
      throw new Error( `Multiple images result in the same import name ${firstDuplicate}: ${originalNames.join( ', ' )}` );
    }
  }

  const copyrightLine = await getCopyrightLine( repo, relativeImageModuleFile );
  await writeFileAndGitAdd( repo, relativeImageModuleFile, fixEOL(
    `${copyrightLine}
/* eslint-disable */
/* @formatter:${OFF} */
/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
 
import LocalizedImageProperty from '../../joist/js/i18n/LocalizedImageProperty.js';
import ${namespace} from './${namespace}.js';
${imageFiles.map( imageFile => `import ${getImportName( imageFile )} from '../${imageFile.replace( '.ts', '.js' )}';` ).join( '\n' )}

const ${imageModuleName} = {
  ${imageNames.map( imageName =>
      `${imageName}ImageProperty: new LocalizedImageProperty( '${imageName}', {
    ${supportedRegionsAndCultures.map( regionAndCulture => `${regionAndCulture}: ${getImportName( spec[ regionAndCulture ][ imageName ] )}` ).join( ',\n    ' )}
  } )` ).join( ',\n  ' )}
};

${namespace}.register( '${imageModuleName}', ${imageModuleName} );

export default ${imageModuleName};
` ) );
};

/**
 * Entry point for modulify, which transforms all the resources in a repo to *.js files.
 *
 * @param repo - the name of a repo, such as 'joist'
 * @param targets - the targets to process, or null for all
 */
export default async ( repo: string, targets: Array<'images' | 'strings' | 'shaders' | 'sounds'> | null ): Promise<void> => {
  const targetImages = targets === null || targets.includes( 'images' );
  const targetStrings = targets === null || targets.includes( 'strings' );
  const targetSounds = targets === null || targets.includes( 'sounds' );

  console.log( `modulifying ${repo} for targets: ${targets ? targets.join( ', ' ) : 'all'}` );

  const visitDirectories = async ( dirs: string[], suffixes: string[], processor: ( repo: string, relativePath: string ) => Promise<void> ) => {
    for ( const dir of dirs ) {
      const dirPath = `../${repo}/${dir}`;
      if ( fs.existsSync( dirPath ) ) {
        const paths: string[] = [];
        grunt.file.recurse( dirPath, async abspath => {
          if ( suffixes.includes( getSuffix( abspath ) ) ) {
            paths.push( path.relative( `../${repo}`, abspath ) );
          }
        } );

        // Run in a separate loop so processors can be awaited.
        for ( let i = 0; i < paths.length; i++ ) {
          await processor( repo, paths[ i ] );
        }
      }
    }
  };

  // Process images in various directories
  const imageDirectories = [ 'images', 'phet/images', 'phet-io/images', 'adapted-from-phet/images' ];
  const mipmapDirectories = [ 'mipmaps', 'phet/mipmaps', 'phet-io/mipmaps', 'adapted-from-phet/mipmaps' ];

  targetImages && await visitDirectories( imageDirectories, SVG_SUFFIXES, modulifySVG );
  targetImages && await visitDirectories( imageDirectories, OTHER_IMAGE_SUFFIXES, modulifyImage );
  targetImages && await visitDirectories( mipmapDirectories, IMAGE_SUFFIXES, modulifyMipmap );
  targetSounds && await visitDirectories( [ `../${repo}/sounds` ], SOUND_SUFFIXES, modulifySound );
  targetStrings && await visitDirectories( [ `../${repo}/strings` ], [ '.ftl' ], modulifyFluentFile );

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );

  // If the YAML strings file exists, transform it into the regular JSON file before going to the next step.
  if ( targetStrings && fs.existsSync( `../${repo}/${repo}-strings_en.yaml` ) ) {
    await convertStringsYamlToJson( repo );
    await generateFluentTypes( repo );
  }

  // Strings module file
  if ( targetStrings && fs.existsSync( `../${repo}/${repo}-strings_en.json` ) && packageObject.phet && packageObject.phet.requirejsNamespace ) {
    await createStringModule( repo );

    generateDevelopmentStrings( repo );
  }

  // Images module file (localized images)
  if ( targetImages && fs.existsSync( `../${repo}/${repo}-images.json` ) ) {
    const supportedRegionsAndCultures: string[] = packageObject?.phet?.simFeatures?.supportedRegionsAndCultures;

    if ( !supportedRegionsAndCultures ) {
      throw new Error( `supportedRegionsAndCultures is not defined in package.json, but ${repo}-images.json exists` );
    }

    if ( !supportedRegionsAndCultures.includes( 'usa' ) ) {
      throw new Error( 'regionAndCulture \'usa\' is required, but not found in supportedRegionsAndCultures' );
    }

    if ( supportedRegionsAndCultures.includes( 'multi' ) && supportedRegionsAndCultures.length < 3 ) {
      throw new Error( 'regionAndCulture \'multi\' is supported, but there are not enough regionAndCultures to support it' );
    }

    const concreteRegionsAndCultures = supportedRegionsAndCultures.filter( regionAndCulture => regionAndCulture !== 'random' );

    // Update the images module file
    await createImageModule( repo, concreteRegionsAndCultures );
  }
};