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
        if (

          // TODO: Use console.log statements to determine if all of these are necessary for the way we use affirm, see https://github.com/phetsims/assert/issues/5
          path.get( 'callee' ).isIdentifier( { name: 'affirm' } ) ||
          ( path.get( 'callee' ).isMemberExpression() &&
            path.get( 'callee.property' ).isIdentifier( { name: 'affirm' } ) )
        ) {
          path.remove();
        }
      },
      ImportDeclaration( path ) {
        // Remove the import declaration if it's importing 'affirm'
        const specifiers = path.node.specifiers;

        // TODO: Check if this correctly removes imports, see https://github.com/phetsims/assert/issues/5
        path.node.specifiers = specifiers.filter(
          specifier => specifier.local.name !== 'affirm'
        );

        // If there are no specifiers left, remove the entire import statement
        if ( path.node.specifiers.length === 0 ) {
          path.remove();
        }
      }
    }
  };
};