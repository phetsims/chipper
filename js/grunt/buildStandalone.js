// Copyright 2017-2023, University of Colorado Boulder

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


// modules
const assert = require( 'assert' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const minify = require( './minify' );
const webpackBuild = require( './webpackBuild' );
const _ = require( 'lodash' );
const getStringMap = require( './getStringMap' );
const ChipperConstants = require( '../common/ChipperConstants' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );
const getPhetLibs = require( './getPhetLibs' );

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 * @public
 *
 * @param {string} repo
 * @param {Object} providedOptions - Passed directly to minify()
 * @returns {Promise<string>}
 */
module.exports = async function( repo, providedOptions ) {
  assert( typeof repo === 'string' );
  assert( typeof providedOptions === 'object' );

  const options = _.merge( {
    isDebug: false,

    // {null|string[]} - if provided, exclude these preloads from the built standalone
    omitPreloads: null,

    // For concurrent builds, provide a unique output dir for the webpack process, default to the repo building
    tempOutputDir: repo
  }, providedOptions );

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  assert( packageObject.phet, '`phet` object expected in package.json' );

  const webpackResult = ( await webpackBuild( repo, 'phet', { outputDir: options.tempOutputDir } ) );

  const webpackJS = webpackResult.js;

  let includedSources = [
    '../assert/js/assert.js',
    '../tandem/js/PhetioIDUtils.js'
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
    includedSources = includedSources.filter( source => !options.omitPreloads.includes( source ) );
  }

  let includedJS = includedSources.map( file => fs.readFileSync( file, 'utf8' ) ).join( '\n' );

  // Checks if lodash exists
  const testLodash = '  if ( !window.hasOwnProperty( \'_\' ) ) {\n' +
                     '    throw new Error( \'Underscore/Lodash not found: _\' );\n' +
                     '  }\n';
  // Checks if jQuery exists
  const testJQuery = '  if ( !window.hasOwnProperty( \'$\' ) ) {\n' +
                     '    throw new Error( \'jQuery not found: $\' );\n' +
                     '  }\n';

  const debugJS = '\nwindow.assertions.enableAssert();\n';
  if ( options.isDebug ) {
    includedJS += debugJS;
  }

  let fullSource = `${includedJS}\n${webpackJS}`;
  if ( packageObject.phet.requiresJQuery ) {
    fullSource = testJQuery + fullSource;
  }
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

    globals += 'phet.chipper.stringPath = \'../\';\n';
    globals += 'phet.chipper.locale = \'en\';\n';
    globals += 'phet.chipper.loadModules = () => {};\n';
    globals += `phet.chipper.strings = ${JSON.stringify( stringMap, null, options.isDebug ? 2 : '' )};\n`;
    globals += `phet.chipper.stringMetadata = ${JSON.stringify( stringMetadata, null, options.isDebug ? 2 : '' )};\n`;
  }
  fullSource = `\n${globals}\n${fullSource}`;

  // Wrap with an IIFE
  fullSource = `(function() {\n${fullSource}\n}());`;

  fullSource = minify( fullSource, options );

  return fullSource;
};
