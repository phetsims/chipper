// Copyright 2023, University of Colorado Boulder
/**
 * @fileoverview Rule that prohibits using the spread operator on anything other than object literals.
 *
 * This is important because it does not do excess property detection.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = {
  meta: {
    type: 'problem'
  },
  create: context => {
    return {
      SpreadElement( node ) {
        if ( node.parent.type === 'ObjectExpression' && node.argument.type !== 'ObjectExpression' ) {
          context.report( {
            node: node,
            message: 'Prevent spread operator on non-literals because it does not do excess property detection'
          } );
        }
      }
    };
  }
};