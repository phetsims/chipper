// Copyright 2017-2022, University of Colorado Boulder

/**
 * Handles transpilation of code using Babel
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */


// modules
const babel = require( '@babel/core' ); // eslint-disable-line require-statement-match

/**
 * Transpile some code to be compatible with the browsers specified below
 * @public
 *
 * @param {string} jsInput
 * @param {boolean} [forIE=false] - whether the jsInput should be transpiled for Internet Explorer
 * @returns {string} - The transpiled code
 */
module.exports = function( jsInput, forIE = false ) {

  // This list specifies the target browsers for Babel. Its format is described at https://browsersl.ist.
  // Note that this is related to System Requirements advertised on the PhET website, so should be modified with care.
  // Never remove advertised platforms from this list without a broader discussion. And note that PhET will sometimes
  // provide unofficial support for older platforms, so version numbers may be lower than what is advertised on the
  // PhET website. For more history, see https://github.com/phetsims/chipper/issues/1323.
  const browsers = [
    'defaults',
    'safari >= 13',
    'iOS >= 13'
  ];
  if ( forIE ) {
    browsers.push( 'IE 11' );
  }

  // See options available at https://babeljs.io/docs/usage/api/
  return babel.transform( jsInput, {

    // Avoids a warning that this gets disabled for >500kb of source. true/false doesn't affect the later minified size, and
    // the 'true' option was faster by a hair.
    compact: true,

    // Use chipper's copy of babel-preset-env, so we don't have to have 30MB extra per sim checked out.
    // This strategy is also used in Transpiler.js
    presets: [ [ '../chipper/node_modules/@babel/preset-env', {

      // Parse as "script" type, so "this" will refer to "window" instead of being transpiled to `void 0` aka undefined
      // see https://github.com/phetsims/chipper/issues/723#issuecomment-443966550
      modules: false,
      targets: {
        browsers: browsers
      }
    } ] ]
  } ).code;
};
