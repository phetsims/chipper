// Copyright 2017-2022, University of Colorado Boulder

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

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 * @public
 *
 * @param {string} repo
 * @param {Object} minifyOptions
 * @returns {Promise}
 */
module.exports = async function( repo, minifyOptions ) {
  assert( typeof repo === 'string' );
  assert( typeof minifyOptions === 'object' );

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  assert( packageObject.phet, '`phet` object expected in package.json' );

  const webpackJS = ( await webpackBuild( repo, 'phet' ) ).js;

  let includedSources = [
    '../assert/js/assert.js',
    '../tandem/js/PhetioIDUtils.js'
  ];

  // add repo-specific preloads from package.json
  if ( packageObject.phet.preload ) {
    assert( Array.isArray( packageObject.phet.preload ), 'preload should be an array' );
    includedSources = includedSources.concat( packageObject.phet.preload );
  }
  if ( minifyOptions.omitPreloads ) {
    includedSources = includedSources.filter( source => !minifyOptions.omitPreloads.includes( source ) );
  }

  const includedJS = includedSources.map( file => fs.readFileSync( file, 'utf8' ) ).join( '\n' );

  // Checks if lodash exists
  const testLodash = '  if ( !window.hasOwnProperty( \'_\' ) ) {\n' +
                     '    throw new Error( \'Underscore/Lodash not found: _\' );\n' +
                     '  }\n';
  // Checks if jQuery exists
  const testJQuery = '  if ( !window.hasOwnProperty( \'$\' ) ) {\n' +
                     '    throw new Error( \'jQuery not found: $\' );\n' +
                     '  }\n';

  let fullSource = `${includedJS}\n${webpackJS}`;
  if ( packageObject.phet.requiresJQuery ) {
    fullSource = testJQuery + fullSource;
  }
  if ( packageObject.phet.requiresLodash ) {
    fullSource = testLodash + fullSource;
  }

  // include globals assignment
  if ( packageObject.phet.assignGlobals ) {
    fullSource = `\nwindow.phet=window.phet||{};phet.chipper=phet.chipper||{};phet.chipper.packageObject=${JSON.stringify( packageObject )}\n${fullSource}`;
  }

  // Wrap with an IIFE
  fullSource = `(function() {\n${fullSource}\n}());`;

  fullSource = minify( fullSource, minifyOptions );

  return fullSource;
};
