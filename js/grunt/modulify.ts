// Copyright 2020-2025, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs, { readFileSync } from 'fs';
import json5 from 'json5';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import writeFileAndGitAdd from '../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import loadFileAsDataURI from '../common/loadFileAsDataURI.js';
import pascalCase from '../common/pascalCase.js';
import toLessEscapedString from '../common/toLessEscapedString.js';
import createMipmap from './createMipmap.js';
import modulifyFluentFile from './fluent/modulifyFluentFile.js';
import generateDevelopmentStrings from './generateDevelopmentStrings.js';
import getCopyrightLine from './getCopyrightLine.js';

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
const replace = ( string: string, search: string, replacement: string ) => string.split( search ).join( replacement );

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
const fixEOL = ( string: string ) => replace( string, '\n', os.EOL );

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
 * Creates the string module at js/${_.camelCase( repo )}Strings.js for repos that need it.
 */
const createStringModule = async ( repo: string ) => {

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const stringModuleName = `${pascalCase( repo )}Strings`;
  const relativeStringModuleFile = `js/${stringModuleName}.ts`;
  const stringModuleFileJS = `../${repo}/js/${stringModuleName}.js`;
  const namespace = _.camelCase( repo );

  if ( fs.existsSync( stringModuleFileJS ) ) {
    console.log( 'Found JS string file in TS repo.  It should be deleted manually.  ' + stringModuleFileJS );
  }

  const copyrightLine = await getCopyrightLine( repo, relativeStringModuleFile );
  await writeFileAndGitAdd( repo, relativeStringModuleFile, fixEOL(
    `${copyrightLine}

/* eslint-disable */
/* @formatter:${OFF} */

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getStringModule from '../../chipper/js/browser/getStringModule.js';
import type LocalizedStringProperty from '../../chipper/js/browser/LocalizedStringProperty.js';
import ${namespace} from './${namespace}.js';

type StringsType = ${getStringTypes( repo )};

const ${stringModuleName} = getStringModule( '${packageObject.phet.requirejsNamespace}' ) as StringsType;

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
` ) );
};

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 */
const getStringTypes = ( repo: string ) => {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const json = JSON.parse( readFileSync( `../${repo}/${repo}-strings_en.json`, 'utf8' ) );

  // Track paths to all the keys with values.
  const all: IntentionalAny[] = [];

  // Recursively collect all of the paths to keys with values.
  const visit = ( level: IntentionalAny, path: string[] ) => {
    Object.keys( level ).forEach( key => {
      if ( key !== '_comment' ) {
        if ( level[ key ].value && typeof level[ key ].value === 'string' ) {

          // Deprecated means that it is used by release branches, but shouldn't be used in new code, so keep it out of the type.
          if ( !level[ key ].deprecated ) {
            all.push( { path: [ ...path, key ], value: level[ key ].value } );
          }
        }
        else {
          visit( level[ key ], [ ...path, key ] );
        }
      }
    } );
  };
  visit( json, [] );

  // Transform to a new structure that matches the types we access at runtime.
  const structure: IntentionalAny = {};
  for ( let i = 0; i < all.length; i++ ) {
    const allElement = all[ i ];
    const path = allElement.path;
    let level = structure;
    for ( let k = 0; k < path.length; k++ ) {
      const pathElement = path[ k ];
      const tokens = pathElement.split( '.' );
      for ( let m = 0; m < tokens.length; m++ ) {
        const token = tokens[ m ];

        assert( !token.includes( ';' ), `Token ${token} cannot include forbidden characters` );
        assert( !token.includes( ',' ), `Token ${token} cannot include forbidden characters` );
        assert( !token.includes( ' ' ), `Token ${token} cannot include forbidden characters` );

        if ( k === path.length - 1 && m === tokens.length - 1 ) {
          if ( !( packageObject.phet && packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsDynamicLocale ) ) {
            level[ token ] = '{{STRING}}'; // instead of value = allElement.value
          }
          level[ `${token}StringProperty` ] = '{{STRING_PROPERTY}}';
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
  text = replace( text, '\'{{STRING_PROPERTY}}\'', 'LocalizedStringProperty' );

  // Add ; to the last in the list
  text = replace( text, ': string\n', ': string;\n' );
  text = replace( text, ': LocalizedStringProperty\n', ': LocalizedStringProperty;\n' );

  // Use ; instead of ,
  text = replace( text, ',', ';' );

  return text;
};

/**
 * Recursively wraps all string values in an object with { value: ... }.
 * If the value is an object, it recurses.
 * Arrays (if any) are also handled.
 * @param input - The parsed JSON5 data.
 * @returns The transformed object.
 */
function nestJSONStringValues( input: Record<string, IntentionalAny> ): object {
  if ( typeof input === 'string' ) {
    return { value: input };
  }
 else if ( input !== null && typeof input === 'object' ) {
    if ( Array.isArray( input ) ) {
      return input.map( nestJSONStringValues );
    }
    const result:Record<string, object> = {};
    for ( const key in input ) {
      // @ts-expect-error
      if ( Object.hasOwn( input, key ) ) {
        result[ key ] = nestJSONStringValues( input[ key ] );
      }
    }
    return result;
  }
  // For numbers, booleans, or null we return as is
  return input;
}

/**
 * Converts a JSON5 file to JSON, nesting each leaf value under a "value" key,
 * and writes the result to a JSON file.
 * @param repo - The name of a repo, e.g. 'joist'
 */
const convertStringsJSON5toJSON = async ( repo:string ) => {
  const filePath = `../${repo}/${repo}-strings_en.json5`;
  const json5Contents = fs.readFileSync( filePath, 'utf8' );
  const parsed = json5.parse( json5Contents );

  // Recursively nest all string values.
  const nested = nestJSONStringValues( parsed );

  // Convert to a pretty-printed JSON string.
  const jsonContents = JSON.stringify( nested, null, 2 );
  const jsonFilename = `${repo}-strings_en.json`;

  await writeFileAndGitAdd( repo, jsonFilename, jsonContents );
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

  // If the JSON5 strings file exists, transform it into the regular JSON file before going to the next step.
  if ( targetStrings && fs.existsSync( `../${repo}/${repo}-strings_en.json5` ) ) {

    // TODO: https://github.com/phetsims/chipper/issues/1588 write a message or banner that the JSON file was machine generated
    // TODO: https://github.com/phetsims/chipper/issues/1588 and should not be edited manually
    await convertStringsJSON5toJSON( repo );
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