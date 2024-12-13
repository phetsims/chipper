// Copyright 2024, University of Colorado Boulder

/**
 * Babel plugin that removes calls to 'affirm', 'affirmCallback', and replaces 'isAffirmEnabled()' with "false" so it can be stripped out as dead code.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function() {
  return {
    visitor: {
      CallExpression( path ) {

        const callee = path.get( 'callee' );

        // Check if the call expression is a call to 'affirm' or 'affirmCallback'
        if ( callee.isIdentifier( { name: 'affirm' } ) ||
             callee.isIdentifier( { name: 'affirmCallback' } ) ) {
          path.remove();
        }

        // Handle the use of a boolean function, so blocks of code can be stripped out too.
        if ( callee.isIdentifier( { name: 'isAffirmEnabled' } ) ) {

          // The internet says replaceWithSourceString() is a bit less performant than using babel/types
          // path.replaceWith( t.booleanLiteral( false ) ), but adding that npm dependency seems like undue overhead
          // for this line.
          path.replaceWithSourceString( 'false' );
        }
      }
    }
  };
};