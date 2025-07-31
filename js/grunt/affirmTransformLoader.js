// Copyright 2024, University of Colorado Boulder

/**
 * Webpack loader that transforms " affirm(" to " assert && affirm("
 *
 * This transformation happens before webpack processes the code, so that we can re-use our logic for stripping or
 * preserving assertions.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = function( source ) {

  // Now do the replacement only for function calls
  return source.replace( / affirm\(/g, ' assert && affirm(' );
};