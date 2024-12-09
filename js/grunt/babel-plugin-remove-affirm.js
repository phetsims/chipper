// Copyright 2024, University of Colorado Boulder

/**
 * Babel plugin that removes calls to 'affirm' and 'affirmLazy'.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function() {
  return {
    visitor: {
      CallExpression( path ) {

        const callee = path.get( 'callee' );

        // Check if the call expression is a call to 'affirm' or 'affirmLazy'
        if ( callee.isIdentifier( { name: 'affirm' } ) ||
             callee.isIdentifier( { name: 'affirmLazy' } ) ) {
          path.remove();
        }
      }
    }
  };
};