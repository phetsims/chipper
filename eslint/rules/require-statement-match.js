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

  return {

    VariableDeclaration: function( node ) {

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
      //            'raw': "'FUNCTION_BUILDER/equations/EquationsScreen'"
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
          const lhs = node.declarations[ 0 ].id.name;
          const rhs = node.declarations[ 0 ].init.arguments[ 0 ].value;

          if ( rhs && rhs.indexOf( '!' ) < 0 ) {
            const lastSlash = rhs.lastIndexOf( '/' );
            const tail = rhs.substring( lastSlash + 1 );

            const isLodash = lhs === '_';
            if ( tail !== lhs && !isLodash ) {
              context.report( {
                node: node,
                loc: node.loc.start,
                message: `Mismatched require statement values, ${lhs} !== ${tail}`
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