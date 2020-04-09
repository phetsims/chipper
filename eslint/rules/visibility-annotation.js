// Copyright 2020, University of Colorado Boulder
/**
 * @fileoverview Rule to check for missing visibility annotations on method definitions.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2020 University of Colorado Boulder
 */

/* eslint-env node */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {

  // annotations that must be used to each method
  const annotations = [ '@private', '@public', '@protected' ];

  return {
    MethodDefinition: node => {
      if ( node.kind !== 'constructor' ) {
        const commentsBefore = context.getSourceCode().getCommentsBefore( node );
        commentsBefore.forEach( comment => {
          if ( !annotations.some( annotation => comment.value.includes( annotation ) ) ) {
            context.report( {
              node: node,
              loc: node.loc,
              message: node.key.name + ': Missing visibility annotation.'
            } );
          }
        } );
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];