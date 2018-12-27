// Copyright 2017, University of Colorado Boulder

/**
 * Handles transpilation of code using Babel
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

// modules
const babel = require( 'babel-core' ); // eslint-disable-line require-statement-match

/**
 * Transpile some code from ES6+ to ES5.
 * @public
 *
 * @param {string} jsInput
 * @returns {string} - The transpiled code
 */
module.exports = function( jsInput ) {
  // See options available at https://babeljs.io/docs/usage/api/
  return babel.transform( jsInput, {
    // Avoids a warning that this gets disabled for >500kb of source. true/false doesn't affect the later minified size, and
    // the 'true' option was faster by a hair.
    compact: true,

    // Use chipper's copy of babel-preset-env, so we don't have to have 30MB extra per sim checked out.
    presets: [ [ '../chipper/node_modules/babel-preset-env', {

      // Parse as "script" type, so "this" will refer to "window" instead of being transpiled to `void 0` aka undefined
      // see https://github.com/phetsims/chipper/issues/723#issuecomment-443966550
      modules: false,
      targets: {
        browsers: [
          // See http://browserl.ist/?q=%3E+0.5%25%2C+safari+9-11%2C+Firefox+ESR%2C+IE+11%2C+ios_saf+11
          '> 0.5%',
          'safari 9-11',
          'Firefox ESR',
          'IE 11',
          'ios_saf 11'
        ]
      }
    } ] ]
  } ).code;
};
