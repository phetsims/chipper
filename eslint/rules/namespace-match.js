// Copyright 2020, University of Colorado Boulder
/**
 * @fileoverview Rule to check for usages of namespace.register( key, value ) to enforce that the key and value match.
 * One exception to this rule is when a function is added directly to the namespace. This is valid and useful
 * particularly in common libraries like dot and scenery.
 *
 * Note that this rule looks for ANY CallExpression whose first argument is a Literal node and whose second
 * argument is an Identifier node. So it will test any usage of register(), even if it isn't called
 * on a namespace. There is no way for the rule to determine if the type of the CallExpression.object is a Namespace,
 * so it cannot be more exclusive.
 *
 * The line namespace.register( 'ClassName', ClassName ) will have an AST node that looks like
 *{
 *   "type": "CallExpression",
 *   "callee": {
 *     "type": "MemberExpression",
 *     "object": {
 *       "type": "Identifier",
 *       "name": "namespace",
 *     },
 *     "property": {
 *       "type": "Identifier",
 *       "name": "register",
 *     },
 *   },
 *   "arguments": [
 *     {
 *       "type": "Literal",
 *       "value": "ClassName",
 *       "raw": "'ClassName'",
 *     },
 *     {
 *       "type": "Identifier",
 *       "name": "ClassName",
 *     }
 *   ]
 * }
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2020 University of Colorado Boulder
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  return {
    CallExpression: node => {
      if ( node.callee && node.callee.type === 'MemberExpression' ) {
        if ( node.callee.property.name === 'register' ) {
          const registerArgs = node.arguments;
          if ( registerArgs.length === 2 ) {
            const firstArg = registerArgs[ 0 ];
            const secondArg = registerArgs[ 1 ];

            // we allow adding functions directly to the namespace
            if ( firstArg.type === 'Literal' && secondArg.type === 'Identifier' ) {
              const firstArgValue = firstArg.value; // string from the Literal node value
              const secondArgName = secondArg.name; // string from the Identifier node name

              if ( firstArgValue !== secondArgName ) {
                context.report( {
                  node: node,
                  loc: node.loc,
                  message: `namespace key must match value - key: ${firstArgValue}, value: ${secondArgName}`
                } );
              }
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