// Copyright 2017, University of Colorado Boulder

/**
 * Handles transpilation of code using Babel
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
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
    presets: [ '../chipper/node_modules/babel-preset-env' ]
  } ).code;
};
