// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a require statement assigns to the correct variable name.
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    VariableDeclaration: function requireStatementMatch( node ) {

      // Here is the AST of a typical require statement node, for reference
      //var exemplar = {
      //  'type': 'VariableDeclaration',
      //  'declarations': [
      //    {
      //      'type': 'VariableDeclarator',
      //      'id': {
      //        'type': 'Identifier',
      //        'name': 'EquationsScreen'
      //      },
      //      'init': {
      //        'type': 'CallExpression',
      //        'callee': {
      //          'type': 'Identifier',
      //          'name': 'require'
      //        },
      //        'arguments': [
      //          {
      //            'type': 'Literal',
      //            'value': 'FUNCTION_BUILDER/equations/EquationsScreen',
      //            'raw': "'FUNCTION_BUILDER/equations/EquationsScreen'"//eslint-disable-line 
      //          }
      //        ]
      //      }
      //    }
      //  ],
      //  'kind': 'var'
      //};

      if ( node.declarations &&
           node.declarations.length > 0 &&
           node.declarations[ 0 ].init &&
           node.declarations[ 0 ].init.arguments &&
           node.declarations[ 0 ].init.arguments.length > 0 ) {
        if ( node.declarations[ 0 ].init &&
             node.declarations[ 0 ].init.callee.name === 'require' ) {
          var lhs = node.declarations[ 0 ].id.name;
          var rhs = node.declarations[ 0 ].init.arguments[ 0 ].value;

          if ( rhs && rhs.indexOf( '!' ) < 0 ) {
            var lastSlash = rhs.lastIndexOf( '/' );
            var tail = rhs.substring( lastSlash + 1 );

            if ( tail !== lhs ) {

              context.report( {
                node: node,
                loc: node.loc.start,
                message: 'Mismatched require statement values, ' + lhs + ' !== ' + tail
              } );
            }
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];