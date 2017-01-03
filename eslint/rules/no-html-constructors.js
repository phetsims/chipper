// Copyright 2017, University of Colorado Boulder
/**
 * @fileoverview Rule to check that we aren't using native JavaScript constructors.
 * This typically occurs when we forget a require statement for a PhET module that has the same name as a native
 * constructor.
 *
 * Using native JavaScript constructors for types like Image, Text, and Range will almost always result in errors
 * that can be difficult to trace. A type can be defined in a file by loading a module through requireJS or by
 * defining a constructor.
 *
 * This rule works by first traversing down the AST, searching for either variable or function declarations of
 * the types that share a name with a native JavaScript constructor. We then traverse back up the AST searching
 * for nodes that represent instantiation of these types.  An error is thrown when we encounter an instantiation
 * of a type that wasn't declared.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2017 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  // map enumerating native JavaScript constructor names
  var typeMap = {
    Image: 'Image',
    Range: 'Range',
    Text: 'Text'
  };

  // list of all types that are declared in the file that have the same name as a native JavaScript constructor
  var declaredTypes = [];

  /**
   * Add a type to declared types if the 'declaration' node has a name which is equal to
   * one of the entires in typeMap.  Called when eslint finds VariableDeclarator or FunctionDeclaration
   * nodes as it traverses down the AST.
   * 
   * @param {ASTNode} node
   */
  function addDeclaredType( node ) {

    // Example...
    // 
    // JavaScript:
    //
    // function Range( min, max ) {...}
    //
    // Corresponding AST:
    //
    // FunctionDeclaration {
    //   type: "FunctionDeclaration",
    //   id: Identifier {
    //     type: "Identifier",
    //     name: "Range"
    //   }
    // }

    if ( node.id && typeMap.hasOwnProperty( node.id.name ) ) {
      declaredTypes.push( node.id.name );
    }
  }

  return {
    VariableDeclarator: addDeclaredType,
    FunctionDeclaration: addDeclaredType,

    /**
     * When eslint traverses back up the AST, search for a node representing an instantiation of a type.  If found,
     * check to see if the type being instantiated is one of the entries that were added to declaredTypes on
     * the first traversal down the AST.
     * 
     * @param  {ASTNode} node
     */
    'NewExpression:exit': function noHTMLConstructor( node ) {

      // Example...
      //
      // JavaScript:
      //
      // var imageNode = new Image( imgsrc );
      //
      // Corresponding AST:
      //
      // exemplar: {
      //   {
      //     "type": "NewExpression",
      //     "callee": {
      //       "type": "Identifier",
      //       "name": "Image"
      //     }
      //   }
      // }

      if ( node.callee && node.callee.name && typeMap.hasOwnProperty( node.callee.name ) ) {
        if ( declaredTypes.indexOf( node.callee.name ) === -1 ) {
          context.report( {
            node: node,
            loc: node.loc.start,
            message: 'using native ' + node.callee.name + ' instead of project module'
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];