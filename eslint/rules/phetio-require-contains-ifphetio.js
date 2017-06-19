// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a require statement that contains PHET_IO also has the preface: ifphetio!
 * @author Michael Kauzmann(PhET Interactive Simulations)
 * @copyright 2016 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    VariableDeclaration: function phetioRequireContainsIfphetio( node ) {

      // Here is the AST of a typical require statement node, for reference
      // ( should be the same comment as in require-statement-match.js)
      //
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
           node.declarations[ 0 ].init.arguments.length > 0 &&
           node.declarations[ 0 ].init.callee.name === 'require' ) {

        var rhs = node.declarations[ 0 ].init.arguments[ 0 ].value;

        // If there is a PHET_IO import, but ifphetio! isn't the first part of the require
        if ( rhs && rhs.indexOf( 'PHET_IO/' ) >= 0 && rhs.indexOf( 'ifphetio!' ) !== 0 ) {


          // This regex will match 'phet-io' plus either a '/' or a '\' afterwards.
          var regex = /phet-io[\/\\]/;

          // Don't check this rule in the phet-io repo
          // Match returns null if it doesn't find anything
          if ( !context.getFilename().match( regex ) ) {
            context.report( {
              node: node,
              loc: node.loc.start,
              message: 'PHET_IO require must start with an ifphetio! check. '
            } );
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];