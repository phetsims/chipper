// Copyright 2020-2025, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fs from 'fs';
// eslint-disable-next-line phet/default-import-match-filename
import fsPromises from 'fs/promises';
import _ from 'lodash';
import path from 'path';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import { asyncLoadFileAsDataURI } from '../../common/loadFileAsDataURI.js';
import pascalCase from '../../common/pascalCase.js';
import toLessEscapedString from '../../common/toLessEscapedString.js';
import createMipmap from '../createMipmap.js';
import generateDevelopmentStrings, { getDevelopmentStringsContents } from '../generateDevelopmentStrings.js';
import getCopyrightLineFromFileContents from '../getCopyrightLineFromFileContents.js';
import convertStringsYamlToJson, { getJSONFromYamlStrings } from './convertStringsYamlToJson.js';
import createStringModule, { getStringModuleContents } from './createStringModule.js';
import generateFluentTypes, { getFluentTypesFileContent } from './generateFluentTypes.js';
import modulifyFluentFile, { getModulifiedFluentFile } from './modulifyFluentFile.js';

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

const FLUENT_SUFFIXES = [ '.ftl' ];

// Process images in various directories
const IMAGE_DIRECTORIES = [ 'images', 'phet/images', 'phet-io/images', 'adapted-from-phet/images' ];
const MIPMAP_DIRECTORIES = [ 'mipmaps', 'phet/mipmaps', 'phet-io/mipmaps', 'adapted-from-phet/mipmaps' ];
const SOUND_DIRECTORIES = [ 'sounds' ];
const STRING_DIRECTORIES = [ 'strings' ];

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
 * Turn a file into a TS file that loads the image.
 */
const getModulifiedImage = async ( repo: string, relativePath: string ): Promise<string> => {
  const abspath = path.resolve( `../${repo}`, relativePath );
  const dataURI = await asyncLoadFileAsDataURI( abspath );

  return `${HEADER}
import asyncLoader from '${expandDots( relativePath )}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = '${dataURI}';
export default image;`;
};

/**
 * Turn a file into a TS file that loads the SVG image.
 */
const getModulifiedSVGImage = async ( repo: string, relativePath: string ): Promise<string> => {
  const abspath = path.resolve( `../${repo}`, relativePath );
  const fileContents = await fsPromises.readFile( abspath, 'utf-8' );

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

  return `${HEADER}
import asyncLoader from '${expandDots( relativePath )}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = \`data:image/svg+xml;base64,\${btoa(${toLessEscapedString( optimizedContents )})}\`;
export default image;`;
};

/**
 * Turn a file into a TS file that loads the mipmap
 */
const getModulifiedMipmap = async ( repo: string, relativePath: string ): Promise<string> => {
  // Defaults. NOTE: using the default settings because we have not run into a need, see
  // https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/945
  const config = {
    level: 4, // maximum level
    quality: 98
  };

  const abspath = path.resolve( `../${repo}`, relativePath );
  const mipmapLevels = await createMipmap( abspath, config.level, config.quality );
  const entries = mipmapLevels.map( ( { width, height, url } ) => `  new MipmapElement( ${width}, ${height}, '${url}' )` );

  return `${HEADER}
import MipmapElement from '${expandDots( relativePath )}chipper/js/browser/MipmapElement.js';

// The levels in the mipmap. Specify explicit types rather than inferring to assist the type checker, for this boilerplate case.
const mipmaps = [
${entries.join( ',\n' )}
];

export default mipmaps;`;
};

/**
 * Turn a file into a TS file that loads the sound
 */
const getModulifiedSound = async ( repo: string, relativePath: string ): Promise<string> => {
  const abspath = path.resolve( `../${repo}`, relativePath );

  // load the sound file
  const dataURI = await asyncLoadFileAsDataURI( abspath );

  // output the contents of the file that will define the sound in JS format
  return `${HEADER}
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
};

// the image module at js/${_.camelCase( repo )}Images.js for repos that need it.
const getImageModule = async ( repo: string, supportedRegionsAndCultures: string[] ): Promise<string> => {
  const spec: Record<string, Record<string, string>> = JSON.parse( await fsPromises.readFile( `../${repo}/${repo}-images.json`, 'utf8' ) );
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

  const copyrightLine = await getCopyrightLineFromFileContents( repo, relativeImageModuleFile );
  return `${copyrightLine}
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
`;
};

/**
 * Transform an image file to a JS file that loads the image.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the image file
 */
const modulifyImage = async ( repo: string, relativePath: string ) => {
  const contents = await getModulifiedImage( repo, relativePath );

  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, contents );
};

/**
 * Transform an SVG image file to a JS file that loads the image.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the SVG file
 */
const modulifySVG = async ( repo: string, relativePath: string ) => {
  const contents = await getModulifiedSVGImage( repo, relativePath );

  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, contents );
};

/**
 * Transform an image file to a JS file that loads the image as a mipmap.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the image file
 */
const modulifyMipmap = async ( repo: string, relativePath: string ) => {
  const contents = await getModulifiedMipmap( repo, relativePath );

  const tsFilename = convertSuffix( relativePath, '.ts' );
  await writeFileAndGitAdd( repo, tsFilename, contents );
};

/**
 * Decode a sound file into a Web Audio AudioBuffer.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the sound file
 */
const modulifySound = async ( repo: string, relativePath: string ) => {
  const contents = await getModulifiedSound( repo, relativePath );

  const jsFilename = convertSuffix( relativePath, '.js' );
  await writeFileAndGitAdd( repo, jsFilename, contents );
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
  const imageModuleName = `${pascalCase( repo )}Images`;
  const relativeImageModuleFile = `js/${imageModuleName}.ts`;

  await writeFileAndGitAdd( repo, relativeImageModuleFile, await getImageModule( repo, supportedRegionsAndCultures ) );
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

  targetImages && await visitDirectories( IMAGE_DIRECTORIES, SVG_SUFFIXES, modulifySVG );
  targetImages && await visitDirectories( IMAGE_DIRECTORIES, OTHER_IMAGE_SUFFIXES, modulifyImage );
  targetImages && await visitDirectories( MIPMAP_DIRECTORIES, IMAGE_SUFFIXES, modulifyMipmap );
  targetSounds && await visitDirectories( SOUND_DIRECTORIES, SOUND_SUFFIXES, modulifySound );
  targetStrings && await visitDirectories( STRING_DIRECTORIES, FLUENT_SUFFIXES, modulifyFluentFile );

  const packageObject = JSON.parse( await fsPromises.readFile( `../${repo}/package.json`, 'utf8' ) );

  // If the YAML strings file exists, transform it into the regular JSON file before going to the next step.
  if ( targetStrings && fs.existsSync( `../${repo}/${repo}-strings_en.yaml` ) ) {
    await convertStringsYamlToJson( repo );
    await generateFluentTypes( repo );
  }

  // Strings module file
  if ( targetStrings && fs.existsSync( `../${repo}/${repo}-strings_en.json` ) && packageObject.phet && packageObject.phet.requirejsNamespace ) {
    await createStringModule( repo );

    await generateDevelopmentStrings( repo );
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

/**
 * Returns either the modulified file content (to be replaced), or null if the file is not a modulified (result) resource.
 *
 * @param relativePath - the relative path of the modulified file, from the project root, e.g. 'joist/images/foo_png.ts'
 */
export const getModulifiedFileString = async ( relativePath: string ): Promise<string | null> => {
  const repo = relativePath.split( '/' )[ 0 ];
  const repoRelativePath = path.relative( `${repo}/`, relativePath );

  const pathWithSuffix = ( suffix: string, codeSuffix: string ) => {
    const nonDotSuffix = suffix.substring( 1 );

    return repoRelativePath.replace( `_${nonDotSuffix}${codeSuffix}`, suffix );
  };

  // Image (SVG/other) module files
  for ( const dir of IMAGE_DIRECTORIES ) {
    if ( relativePath.startsWith( `${repo}/${dir}/` ) ) {
      const imageSuffix = `.${relativePath.match( /_(\w+)\.ts$/ )?.[ 1 ] ?? ''}`;

      if ( SVG_SUFFIXES.includes( imageSuffix ) ) {
        return getModulifiedSVGImage( repo, pathWithSuffix( imageSuffix, '.ts' ) );
      }
      else if ( OTHER_IMAGE_SUFFIXES.includes( imageSuffix ) ) {
        return getModulifiedImage( repo, pathWithSuffix( imageSuffix, '.ts' ) );
      }
    }
  }

  // Mipmap module files
  for ( const dir of MIPMAP_DIRECTORIES ) {
    if ( relativePath.startsWith( `${repo}/${dir}/` ) ) {
      const mipmapSuffix = `.${relativePath.match( /_(\w+)\.ts$/ )?.[ 1 ] ?? ''}`;

      if ( IMAGE_SUFFIXES.includes( mipmapSuffix ) ) {
        return getModulifiedMipmap( repo, pathWithSuffix( mipmapSuffix, '.ts' ) );
      }
    }
  }

  // Sound module files
  for ( const dir of SOUND_DIRECTORIES ) {
    if ( relativePath.startsWith( `${repo}/${dir}/` ) ) {
      const soundSuffix = `.${relativePath.match( /_(\w+)\.js$/ )?.[ 1 ] ?? ''}`;

      if ( SOUND_SUFFIXES.includes( soundSuffix ) ) {
        return getModulifiedSound( repo, pathWithSuffix( soundSuffix, '.js' ) );
      }
    }
  }

  // Fluent files
  if ( relativePath.startsWith( `${repo}/js/strings/` ) && relativePath.endsWith( 'Messages.ts' ) ) {
    return getModulifiedFluentFile( repo, `strings/${path.basename( relativePath.replace( /Messages\.ts$/, '' ) )}_en.ftl` );
  }

  const getEnglishStringsContents = async ( requestedRepo: string ): Promise<string> => {
    if ( fs.existsSync( `../${requestedRepo}/${requestedRepo}-strings_en.yaml` ) ) {
      return getJSONFromYamlStrings( requestedRepo );
    }
    else {
      return fsPromises.readFile( `../${requestedRepo}/${requestedRepo}-strings_en.json`, 'utf8' );
    }
  };

  // If we have YAML strings and get a direct request for the JSON, modulify it on the fly.
  if ( relativePath === `${repo}/${repo}-strings_en.json` && fs.existsSync( `../${repo}/${repo}-strings_en.yaml` ) ) {
    return getEnglishStringsContents( repo );
  }

  // String module file
  if ( relativePath === `${repo}/js/${_.camelCase( repo )}Strings.js` ) {
    return getStringModuleContents( repo );
  }

  // Babel development strings files
  if ( relativePath.startsWith( 'babel/_generated_development_strings/' ) && relativePath.endsWith( '_all.json' ) ) {
    const requestedRepo = path.basename( relativePath ).split( '_' )[ 0 ];

    return getDevelopmentStringsContents( requestedRepo, await getEnglishStringsContents( requestedRepo ) );
  }

  // Region-and-culture image module file
  if ( relativePath === `${repo}/js/${pascalCase( repo )}Images.ts` ) {
    const packageObject = JSON.parse( await fsPromises.readFile( `../${repo}/package.json`, 'utf8' ) );

    const supportedRegionsAndCultures: string[] = packageObject?.phet?.simFeatures?.supportedRegionsAndCultures;
    const concreteRegionsAndCultures = supportedRegionsAndCultures.filter( regionAndCulture => regionAndCulture !== 'random' );

    return getImageModule( repo, concreteRegionsAndCultures );
  }

  // Fluent types file
  if ( relativePath === `${repo}/js/${pascalCase( repo )}Fluent.ts` ) {
    return getFluentTypesFileContent( repo );
  }

  return null;
};