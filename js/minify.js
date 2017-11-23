// Copyright 2017, University of Colorado Boulder

/**
 * Uglifies the given JS code (with phet-relevant options)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const uglify = require( 'uglify-es' );

/**
 * Returns a minified version of the code (with optional mangling).
 * @public
 *
 * @param {Object} grunt
 * @param {string} js - The source code
 * @param {Object} [options]
 * @returns {string} - The minified code
 */
module.exports = function( grunt, js, options ) {
  const {
    mangle = true
  } = options || {};

  var result = uglify.minify( js, {
    mangle: mangle ? {
      safari10: true // works around a safari 10 bug. currently a supported platform
    } : false,

    compress: {
      // defaults to remove dead code (dead_code option no longer required)
      dead_code: true, // remove unreachable code

      // To define globals, use global_defs inside compress options, see https://github.com/jrburke/r.js/issues/377
      global_defs: {

        // global assertions (PhET-specific)
        assert: false,
        assertSlow: false,

        // scenery logging (PhET-specific)
        sceneryLog: false,
        sceneryAccessibilityLog: false,

        // for tracking object allocations, see phet-core/js/phetAllocation.js (PhET-specific)
        phetAllocation: false
      }
    },

    // output options documented at https://github.com/mishoo/UglifyJS2#beautifier-options
    output: {
      inline_script: true, // escape </script
      beautify: !mangle
    }
  } );

  if ( result.error ) {
    throw new Error( result.error );
  }
  else {
    return result.code;
  }
};
