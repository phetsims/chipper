// Copyright 2016, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a require statement does not also do a property access
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2016 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    VariableDeclaration: function noAttributesInRequireStatement( node ) {

      if ( node.declarations &&
           node.declarations.length > 0 &&
           node.declarations[ 0 ] &&
           node.declarations[ 0 ].init &&
           node.declarations[ 0 ].init.type &&
           node.declarations[ 0 ].init.type === 'MemberExpression' &&
           node.declarations[ 0 ].init.object &&
           node.declarations[ 0 ].init.object.callee &&
           node.declarations[ 0 ].init.object.callee.name &&
           node.declarations[ 0 ].init.object.callee.name === 'require' ) {

        context.report( {
          node: node,
          loc: node.loc.start,
          message: 'property access in require statement'
        } );
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];