// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to guarantee we do not use instanceof Array
 * @author Denzell Barnett (PhET Interactive Simulations)
 * @copyright 2018 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {
    BinaryExpression: function( node ) {
      if ( node.operator === 'instanceof' && node.right.type === 'Identifier' && node.right.name === 'Array' ) {
        context.report( {
          node: node,
          message: 'Use Array.isArray() instead of instanceof Array',
          data: {
            identifier: node.name
          }
        } );
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];