// Copyright 2020, University of Colorado Boulder
/**
 * @fileoverview Rule to check for missing visibility annotations on method definitions.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2020 University of Colorado Boulder
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  const annotations = [ '@private', '@public', '@protected' ];

  // these are still MethodDefinition nodes, but don't require an annotation
  const exemptMethods = [ 'get', 'set', 'constructor' ];

  return {
    MethodDefinition: node => {
      if ( !exemptMethods.includes( node.kind ) ) {
        let includesAnnotation = false;
        const commentsBefore = context.getSourceCode().getCommentsBefore( node );

        // OK as long as any comment above the method (block or line) has an annotation
        for ( let i = 0; i < commentsBefore.length; i++ ) {
          if ( annotations.some( annotation => commentsBefore[ i ].value.includes( annotation ) ) ) {
            includesAnnotation = true;
            break;
          }
        }
        if ( !includesAnnotation ) {
          context.report( {
            node: node,
            loc: node.loc,
            message: node.key.name + ': Missing visibility annotation.'
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];