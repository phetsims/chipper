// Copyright 2019, University of Colorado Boulder

/**
 * @fileoverview Rule to enforce disallowing of shorthand for object properties. Object method shorthand is allowed
 * @author Jamund Ferguson (original author of eslint file)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * This rule was adapted straight from eslint's object shorthand rule, and adapted/simplified for PhET purposes, see
 * original file: https://github.com/eslint/eslint/blob/550de1e611a1e9af873bcb18d74cf2056e8d2e1b/lib/rules/object-shorthand.js
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
module.exports = function( context ) {
  'use strict';

  return {
    'Property:exit'( node ) {

      // Ignore destructuring assignment
      if ( node.parent.type === 'ObjectPattern' ) {
        return;
      }

      // getters and setters are ignored
      if ( node.kind === 'get' || node.kind === 'set' ) {
        return;
      }

      // only computed methods can fail the following checks
      if ( node.computed && node.value.type !== 'FunctionExpression' && node.value.type !== 'ArrowFunctionExpression' ) {
        return;
      }

      // { x } should be written as { x: x }
      node.shorthand && context.report( {
        node: node,
        message: 'Expected longform property syntax.',
        fix: fixer => fixer.insertTextAfter( node.key, `: ${node.key.name}` )
      } );
    }
  };
};