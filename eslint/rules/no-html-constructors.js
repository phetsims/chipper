// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that usages of Image are using scenery Image.
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
    //TODO Range will fail because its implementation refers to itself and has no require statement, see https://github.com/phetsims/chipper/issues/454
    // Range: '\'DOT/Range\'',
    Text: '\'SCENERY/nodes/Text\''
  };

  return {

    NewExpression: function noHTMLConstructor( node ) {

      // Here is the AST of a typical creation of an Image node
      // such as var imageNode = new Image( imgsrc );
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