// Copyright 2017, University of Colorado Boulder

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const fs = require( 'fs' );
const minify = require( './minify' );
const requireBuild = require( './requireBuild' );

/**
 * Builds standalone JS deliverables (e.g. dot/kite/scenery)
 * @public
 *
 * @param {Object} grunt
 * @param {string} repo
 * @param {boolean} uglify
 * @param {boolean} mangle
 */
module.exports = async function( grunt, repo, uglify, mangle ) {
  assert( typeof repo === 'boolean' );
  assert( typeof uglify === 'boolean' );
  assert( typeof mangle === 'boolean' );

  const packageObject = grunt.file.readJSON( '../' + repo + '/package.json' );

  const requireJS = await requireBuild( grunt, '../' + repo + '/js/' + repo + '-config.js', { wrap: false } );

  const includedSources = [
    '../assert/js/assert.js'
  ];
  if ( repo === 'scenery' ) {
    includedSources.push( '../sherpa/lib/himalaya-0.2.7.js' );
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

  var fullSource = includedJS + '\n' + requireJS;
  if ( packageObject.phet.requiresJQuery ) {
    fullSource = testJQuery + fullSource;
  }
  if ( packageObject.phet.requiresLodash ) {
    fullSource = testLodash + fullSource;
  }

  // include globals assignment
  fullSource += Object.keys( packageObject.phet.assignGlobals ).sort().map( function( global ) {
    // For each key=>value in packageObject.phet.assignGlobals, we want to set window.key = require( 'value' ), to initialize our globals
    return '\n  window.' + global + ' = require( \'' + packageObject.phet.assignGlobals[ global ] + '\' );';
  } ).join( '' );

  if ( packageObject.phet.finalizeJS ) {
    fullSource += packageObject.phet.finalizeJS;
  }

  // Wrap with an IIFE
  fullSource = '(function() {\n' + fullSource + '\n}());';

  if ( uglify ) {
    fullSource = minify( grunt, fullSource, { mangle: mangle } );
  }

  return fullSource;
};
