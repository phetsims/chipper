// Copyright 2021, University of Colorado Boulder

/**
 * @fileoverview Rule to check for casing convention of naming Enumerations, which should be like
 * a class/type.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2021 University of Colorado Boulder
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {

  /**
   * @param {String} nameString
   * @param {ASTNode} node
   */
  const verifyEnumerationName = ( nameString, node ) => {
    if ( nameString[ 0 ] !== nameString[ 0 ].toUpperCase() ) {
      context.report( {
        node: node,
        loc: node.loc,
        message: `${nameString}: Enumerations should be named like classes/types.`
      } );
    }
  };

  return {

    /**
     * Detect when Enumeration is being declared as a variable, like
     * const TemperatureUnits = Enumeration.byKeys( [ 'KELVIN', 'CELSIUS' ] );
     *
     * which will have an AST like
     * {
     *   "type": "VariableDeclarator",
     *   "id": {
     *     "name": "TemperatureUnits",
     *   },
     *   "init": {
     *     "callee": {
     *       "object": {
     *         "type": "Identifier",
     *         "name": "Enumeration",
     *       }
     *     }
     *   }
     * }
     *
     * @param {ASTNode} node
     */
    VariableDeclarator: node => {
      if ( node.init && node.init.callee && node.init.callee.object ) {
        if ( node.init.callee.object.name === 'Enumeration' ) {
          verifyEnumerationName( node.id.name, node );
        }
      }
    },

    /**
     * When the enumeration is being assigned as variable. May look something like
     * PlayArea.Dimension = Enumeration.byKeys( [ 'ONE', 'TWO' ] );
     *
     * And the AST will look something like
     * {
     *   "type": "ExpressionStatement",
     *   "expression": {
     *     "type": "AssignmentExpression",
     *     "left": {
     *       "object": {
     *         "name": "PlayArea",
     *       },
     *       "property": {
     *         "name": "Dimension",
     *       },
     *     },
     *     "right": {
     *       "callee": {
     *         "type": "MemberExpression",
     *         "object": {
     *           "name": "Enumeration",
     *         },
     *       }
     *     }
     *   }
     * }
     *
     * @param {ASTNode} node
     */
    ExpressionStatement: node => {
      if ( node.expression && node.expression.right && node.expression.right.callee ) {

        // right hand side, creating an Enumeration
        if ( node.expression.right.callee.object ) {
          if ( node.expression.right.callee.object.name ) {
            if ( node.expression.right.callee.object.name === 'Enumeration' ) {

              // left hand side, assigning Enumeration to variable name
              if ( node.expression.left && node.expression.left.property ) {
                if ( node.expression.left.property.name ) {
                  const enumerationName = node.expression.left.property.name;
                  verifyEnumerationName( enumerationName, node );
                }
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