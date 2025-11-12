// Copyright 2025, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import fs, { readFileSync } from 'fs';
import _ from 'lodash';
import path from 'path';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import FluentLibrary, { FluentBundle, FluentResource } from '../../browser-and-node/FluentLibrary.js';
import getCopyrightLineFromFileContents from '../getCopyrightLineFromFileContents.js';
import type { ModulifiedFile } from './modulify.js';

const OFF = 'off';

/**
 * Reads a Fluent.js file from the absolute path. Removes any comments from the file to reduce the size of the module.
 * @param abspath - the absolute path of the file
 */
const readFluentFile = ( abspath: string ): string => {
  const fileContents = readFileSync( abspath, 'utf8' );

  // Remove Fluent.js comments from the file contents
  return fileContents.replace( /#.*(\r?\n|$)/g, '' );
};

/**
 * Turn a file into a TS file that loads the fluent messages
 */
export const getModulifiedFluentFile = async ( repo: string, relativePath: string ): Promise<ModulifiedFile> => {
  if ( !relativePath.endsWith( '_en.ftl' ) ) {
    throw new Error( 'Only english fluent files can be modulified.' );
  }

  const usedRelativeFiles: string[] = [];

  const abspath = path.resolve( `../${repo}`, relativePath );
  const filename = path.basename( abspath );

  const nameWithoutSuffix = filename.replace( '_en.ftl', '' );

  const localeToFluentFileContents: Record<string, string> = {};
  localeToFluentFileContents.en = readFluentFile( abspath );
  usedRelativeFiles.push( relativePath );

  const babelPath = `../babel/fluent/${repo}`;

  let localBabelFiles: string[] = [];
  usedRelativeFiles.push( `babel/fluent/${repo}` );
  if ( fs.existsSync( babelPath ) ) {
    localBabelFiles = fs.readdirSync( babelPath );
  }

  localBabelFiles.forEach( babelFile => {
    if ( babelFile.startsWith( `${nameWithoutSuffix}_` ) ) {
      const locale = babelFile.match( /_([^_]+)\.ftl/ )![ 1 ];

      if ( !locale ) {
        throw new Error( `Could not determine locale from ${babelFile}` );
      }

      usedRelativeFiles.push( `babel/fluent/${repo}/${babelFile}` );
      localeToFluentFileContents[ locale ] = readFluentFile( `${babelPath}/${babelFile}` );
    }
  } );

  // Loop through every fluent file and do any necessary checks for syntax.
  Object.values( localeToFluentFileContents ).forEach( fluentFile => {
    FluentLibrary.verifyFluentFile( fluentFile );
  } );

  const fluentKeys = FluentLibrary.getFluentMessageKeys( localeToFluentFileContents.en );

  const englishBundle = new FluentBundle( 'en' );
  englishBundle.addResource( new FluentResource( localeToFluentFileContents.en ) );

  // Convert keys into a type that we can use in the generated file
  let fluentKeysType = `type ${nameWithoutSuffix}FluentType = {`;
  fluentKeys.forEach( ( fluentKey: string ) => {
    const isStringProperty = typeof englishBundle.getMessage( fluentKey )!.value === 'string';
    fluentKeysType += `\n  '${fluentKey}MessageProperty': ${isStringProperty ? 'TReadOnlyProperty<string>' : 'LocalizedMessageProperty'};`;
  } );
  fluentKeysType += '\n};';

  const modulifiedName = `${nameWithoutSuffix}Messages`;
  const relativeModulifiedName = `js/strings/${modulifiedName}.ts`;
  const namespace = _.camelCase( repo );
  const copyrightLine = await getCopyrightLineFromFileContents( repo, relativeModulifiedName );

  return {
    content: `${copyrightLine}
    
/* eslint-disable */
/* @formatter:${OFF} */

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getFluentModule from '../../../chipper/js/browser/getFluentModule.js';
import ${namespace} from '../../js/${namespace}.js';
import LocalizedMessageProperty from '../../../chipper/js/browser/LocalizedMessageProperty.js';
import type { TReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';

${fluentKeysType}

const ${modulifiedName} = getFluentModule( ${JSON.stringify( localeToFluentFileContents, null, 2 ).replaceAll( '\\r\\n', '\\n' )} ) as unknown as ${nameWithoutSuffix}FluentType;

${namespace}.register( '${modulifiedName}', ${modulifiedName} );

export default ${modulifiedName};
`,
    usedRelativeFiles: usedRelativeFiles
  };
};

/**
 * Prepares modules so that contents of fluent files can be used in the simulation.
 * @param repo - repository name for the modulify command
 * @param relativePath - the relative path of the fluent file
 */
const modulifyFluentFile = async ( repo: string, relativePath: string ): Promise<void> => {
  if ( !relativePath.endsWith( '_en.ftl' ) ) {
    throw new Error( 'Only english fluent files can be modulified.' );
  }

  const abspath = path.resolve( `../${repo}`, relativePath );
  const filename = path.basename( abspath );

  const nameWithoutSuffix = filename.replace( '_en.ftl', '' );

  const modulifiedName = `${nameWithoutSuffix}Messages`;
  const relativeModulifiedName = `js/strings/${modulifiedName}.ts`;

  const contents = ( await getModulifiedFluentFile( repo, relativePath ) ).content;

  await writeFileAndGitAdd( repo, relativeModulifiedName, contents );
};

export default modulifyFluentFile;