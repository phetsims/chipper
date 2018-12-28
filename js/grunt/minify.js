// Copyright 2017, University of Colorado Boulder

/**
 * Uglifies the given JS code (with phet-relevant options)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const transpile = require( './transpile' );
const uglifyES = require( 'uglify-es' ); // eslint-disable-line require-statement-match

const MINIFY_DEFAULTS = {
  minify: true,

  // Only enabled if minify is true
  babelTranspile: true,
  uglify: true,

  // Only enabled if uglify is true
  mangle: true,
  stripAssertions: true,
  stripLogging: true,
  beautify: false
};

const minify = function( js, options ) {
  options = _.extend( {}, MINIFY_DEFAULTS, options );

  // Promote to top level variables
  const { minify, babelTranspile, uglify, mangle, stripAssertions, stripLogging, beautify } = options;

  if ( !minify ) {
    return js;
  }

  // Do transpilation before uglifying.
  if ( babelTranspile ) {
    js = transpile( js );
  }

  const uglifyOptions = {
    mangle: mangle ? {
      safari10: true // works around a safari 10 bug. currently a supported platform
    } : false,

    compress: {
      // defaults to remove dead code (dead_code option no longer required)
      dead_code: true, // remove unreachable code

      // To define globals, use global_defs inside compress options, see https://github.com/jrburke/r.js/issues/377
      global_defs: {}
    },

    // output options documented at https://github.com/mishoo/UglifyJS2#beautifier-options
    output: {
      inline_script: true, // escape </script
      beautify: beautify
    }
  };

  // global assertions (PhET-specific)
  if ( stripAssertions ) {
    uglifyOptions.compress.global_defs.assert = false;
    uglifyOptions.compress.global_defs.assertSlow = false;
  }

  // scenery logging (PhET-specific)
  if ( stripLogging ) {
    uglifyOptions.compress.global_defs.sceneryLog = false;
    uglifyOptions.compress.global_defs.sceneryAccessibilityLog = false;
  }

  if ( uglify ) {

    const result = uglifyES.minify( js, uglifyOptions );

    if ( result.error ) {
      console.log( result.error );
      throw new Error( result.error );
    }
    else {
      // workaround for Uglify2's Unicode unescaping. see https://github.com/phetsims/chipper/issues/70
      // TODO: is this workaround still required?
      return result.code.replace( '\x0B', '\\x0B' );
    }
  }
  else {
    return js;
  }
};

// @public (read-only) - export defaults
minify.MINIFY_DEFAULTS = MINIFY_DEFAULTS;

/**
 * Returns a minified version of the code (with optional mangling).
 * @public
 *
 * @param {string} js - The source code
 * @param {Object} [options]
 * @returns {string} - The minified code
 */
module.exports = minify;