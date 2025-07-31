// Copyright 2017-2025, University of Colorado Boulder

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

/**
 * Uglifies the given JS code (with phet-relevant options)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import _ from 'lodash';
import transpileForBuild from './transpileForBuild.js';

const terser = require( 'terser' );

export type MinifyOptions = {
  minify?: boolean;

  // Only enabled if minify is true
  babelTranspile?: boolean;
  uglify?: boolean;

  // Only enabled if uglify is true
  mangle?: boolean;
  stripAssertions?: boolean;
  stripLogging?: boolean;
  beautify?: boolean;
};

const MINIFY_DEFAULTS: MinifyOptions = {
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

/**
 * Minifies the given JS code (with phet-relevant options). Note that often the parameters conflict with each other. For
 * instance, during one phase of a dot standalone build, stripAssertions is true but babelTranspile is false.
 *
 * @param js
 * @param options
 */
const minify = function( js: string, options?: MinifyOptions ): string {
  options = _.assignIn( {}, MINIFY_DEFAULTS, options );

  // Promote to top level variables
  const { minify, babelTranspile, uglify, mangle, stripAssertions, stripLogging, beautify } = options;

  if ( !minify ) {
    return js;
  }

  // Do transpilation before uglifying.
  if ( babelTranspile ) {
    js = transpileForBuild( js );
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
  }

  if ( uglify ) {
    const result = terser.minify( js, uglifyOptions );

    if ( result.error ) {
      console.log( result.error );
      throw new Error( result.error );
    }
    else {
      // workaround for Uglify2's Unicode unescaping. see https://github.com/phetsims/chipper/issues/70
      // Also, 0x7f is converted for https://github.com/phetsims/scenery/issues/1687.
      return result.code.replace( '\x0B', '\\x0B' ).replace( /\u007f/g, '\\u007f' );
    }
  }
  else {
    return js;
  }
};

minify.MINIFY_DEFAULTS = MINIFY_DEFAULTS;

/**
 * Returns a minified version of the code (with optional mangling).
 */
export default minify;