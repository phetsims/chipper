// Copyright 2017-2026, University of Colorado Boulder

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs, { readFileSync } from 'fs';
import _ from 'lodash';
import optionize from '../../../phet-core/js/optionize.js';
import ChipperConstants from '../common/ChipperConstants.js';
import getLocalesFromRepository from './getLocalesFromRepository.js';
import getPhetLibs from './getPhetLibs.js';
import getStringMap from './getStringMap.js';
import minify, { MinifyOptions } from './minify.js';
import webpackBuild from './webpackBuild.js';

type SelfOptions = {
  isDebug?: boolean;

  // if provided, exclude these preloads from the built standalone
  omitPreloads?: string[] | null;

  // For concurrent builds, provide a unique output dir for the webpack process, default to the repo building
  tempOutputDir?: string;

  // Some phet-io wrapper repos want to be built as "phet-io" brand so that resources under `phet-io` dirs are included.
  brand?: string;

  profileFileSize?: boolean;
};

type BuildStandaloneOptions = SelfOptions & MinifyOptions;

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 *
 * @param repo
 * @param providedOptions - Passed directly to minify()
 */
export default async function buildStandalone( repo: string, providedOptions?: BuildStandaloneOptions ): Promise<string> {

  const options = optionize<BuildStandaloneOptions, SelfOptions, MinifyOptions>()( {
    isDebug: false,
    omitPreloads: null,
    tempOutputDir: repo,
    brand: 'phet',
    profileFileSize: false
  }, providedOptions );

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  assert( packageObject.phet, '`phet` object expected in package.json' );

  const webpackResult = ( await webpackBuild( repo, options.brand, {
    outputDir: options.tempOutputDir,
    profileFileSize: options.profileFileSize
  } ) );

  const webpackJS = webpackResult.js;

  let includedSources = [
    '../assert/js/assert.js'
  ];

  // add repo-specific preloads from package.json
  if ( packageObject.phet.preload ) {
    assert( Array.isArray( packageObject.phet.preload ), 'preload should be an array' );
    includedSources = includedSources.concat( packageObject.phet.preload );

    // NOTE: Should find a better way of handling putting these first
    includedSources.forEach( ( source, index ) => {
      if ( source.includes( 'sherpa/lib/lodash-' ) ) {
        includedSources.splice( index, 1 );
        includedSources.unshift( source );
      }
    } );
    includedSources.forEach( ( source, index ) => {
      if ( source.includes( 'sherpa/lib/jquery-' ) ) {
        includedSources.splice( index, 1 );
        includedSources.unshift( source );
      }
    } );
  }
  if ( options.omitPreloads ) {
    includedSources = includedSources.filter( source => !options.omitPreloads!.includes( source ) );
  }

  let includedJS = includedSources.map( file => fs.readFileSync( file, 'utf8' ) ).join( '\n' );

  // Checks if lodash exists
  const testLodash = '  if ( !window.hasOwnProperty( \'_\' ) ) {\n' +
                     '    throw new Error( \'Underscore/Lodash not found: _\' );\n' +
                     '  }\n';

  const debugJS = '\nwindow.assertions.enableAssert();\n';
  if ( options.isDebug ) {
    includedJS += debugJS;
  }

  let fullSource = `${includedJS}\n${webpackJS}`;
  if ( packageObject.phet.requiresLodash ) {
    fullSource = testLodash + fullSource;
  }

  // include globals assignment
  let globals = 'window.phet=window.phet||{}\n;';
  if ( packageObject.name === 'phet-lib' ) {
    globals += `phet.chipper=phet.chipper||{};\nphet.chipper.packageObject=${JSON.stringify( packageObject )};\n`;

    const subRepos = [ 'scenery', 'sun', 'scenery-phet', 'twixt', 'mobius' ];

    const phetLibs = _.uniq( _.flatten( subRepos.map( subRepo => {
      return getPhetLibs( subRepo );
    } ) ).sort() );
    const locales = [
      ChipperConstants.FALLBACK_LOCALE,
      ..._.flatten( subRepos.map( subRepo => getLocalesFromRepository( subRepo ) ) )
    ];
    const { stringMap, stringMetadata } = getStringMap( repo, locales, phetLibs, webpackResult.usedModules );

    const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

    globals += 'phet.chipper.stringPath = \'../\';\n';
    globals += 'phet.chipper.locale = \'en\';\n';
    globals += 'phet.chipper.loadModules = () => {};\n';
    globals += `phet.chipper.strings = ${JSON.stringify( stringMap, null, options.isDebug ? 2 : '' )};\n`;
    globals += `phet.chipper.localeData = ${JSON.stringify( localeData, null, options.isDebug ? 2 : '' )};\n`;
    globals += `phet.chipper.stringMetadata = ${JSON.stringify( stringMetadata, null, options.isDebug ? 2 : '' )};\n`;
  }
  fullSource = `\n${globals}\n${fullSource}`;

  // Wrap with an IIFE
  fullSource = `(function() {\n${fullSource}\n}());`;

  fullSource = minify( fullSource, options );

  return fullSource;
}