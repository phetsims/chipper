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
 * @param {Object} grunt
 * @param {string} jsInput
 * @returns {string} - The transpiled code
 */
module.exports = function( grunt, jsInput ) {
  return babel.transform( jsInput, {
    presets: [ '../chipper/node_modules/babel-preset-env' ]
  } ).code;
};
