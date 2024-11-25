// Copyright 2024, University of Colorado Boulder

/**
 * Babel plugin that removes calls to 'affirm' and import statements for 'affirm'.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function() {
  return {
    visitor: {
      CallExpression( path ) {

        // Check if the call expression is a call to 'affirm'
        if ( path.get( 'callee' ).isIdentifier( { name: 'affirm' } ) ) {
          path.remove();
        }
      }
    }
  };
};