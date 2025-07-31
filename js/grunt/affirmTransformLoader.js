// Copyright 2025, University of Colorado Boulder

/**
 * Webpack loader that transforms " affirm(" to " assert && affirm("
 *
 * This transformation happens before webpack processes the code, so that we can re-use our logic for stripping or
 * preserving assertions.
 *
 * Webpack loader/use cannot accept *.ts, so this must remain as a JavaScript file.
 *
 * NOTE: This loader should NOT be used on affirm.ts.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = function( source ) {

  // Now do the replacement only for function calls
  return source.replace( / affirm\(/g, ' assert && affirm(' );
};