// Copyright 2016, University of Colorado Boulder
/**
 * @fileoverview Rule to check that we aren't using native JavaScript constructors.
 * This typically occurs when we forget a require statement for a PhET module that has the same name as a native constructor.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  // maps a native JavaScript constructor to the corresponding PhET module with the same name
  var moduleMap = {
    Image: '\'SCENERY/nodes/Image\'',
    Range: '\'DOT/Range\'',
    Text: '\'SCENERY/nodes/Text\''
  };

  return {

    NewExpression: function noHTMLConstructor( node ) {

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

      if ( node.callee && node.callee.name && moduleMap.hasOwnProperty( node.callee.name ) ) {

        var usingModule = false;  // are we using a module loaded via requirejs?

        // search through source tokens for the path to the module
        var source = context.getSourceCode();
        var modulePath = moduleMap[ node.callee.name ];
        source.tokensAndComments.forEach( function( token ) {
          if ( token.value === modulePath ) {
            usingModule = true;
          }
        } );

        if ( !usingModule ) {
          context.report( {
            node: node,
            loc: node.loc.start,
            message: 'using native ' + node.callee.name + ' instead of module ' + modulePath
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];