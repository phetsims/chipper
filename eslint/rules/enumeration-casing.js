// Copyright 2021, University of Colorado Boulder

/**
 * @fileoverview Rule to check for casing convention of naming Enumerations, which should be like
 * a class/type.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2021 University of Colorado Boulder
 */


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
     * Detect when EnumerationDeprecated is being declared as a variable, like
     * const TemperatureUnits = EnumerationDeprecated.byKeys( [ 'KELVIN', 'CELSIUS' ] );
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
     *         "name": "EnumerationDeprecated",
     *       }
     *     }
     *   }
     * }
     *
     * @param {ASTNode} node
     */
    VariableDeclarator: node => {
      if ( node.init && node.init.callee && node.init.callee.object ) {
        if ( node.init.callee.object.name === 'EnumerationDeprecated' ) {
          verifyEnumerationName( node.id.name, node );
        }
      }
    },

    /**
     * When the enumeration is being assigned as variable. May look something like
     * PlayArea.Dimension = EnumerationDeprecated.byKeys( [ 'ONE', 'TWO' ] );
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
     *           "name": "EnumerationDeprecated",
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

        // right hand side, creating an EnumerationDeprecated
        if ( node.expression.right.callee.object ) {
          if ( node.expression.right.callee.object.name ) {
            if ( node.expression.right.callee.object.name === 'EnumerationDeprecated' ) {

              // left hand side, assigning EnumerationDeprecated to variable name
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