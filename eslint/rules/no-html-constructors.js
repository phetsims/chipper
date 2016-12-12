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


  // path to each module which the dev might have accidentally used
  // the HTML constructor instead. 
  var calleeModulePathMap = {
    Image: '\'SCENERY/nodes/Image\'',
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
      
      if ( node.callee && 
           node.callee.name &&
           node.callee.name === 'Image' ||
           node.callee.name === 'Text' ) {

        var sceneryModulePath = calleeModulePathMap[ node.callee.name ];

        // search through source tokens for the path to the scenery Node
        var source = context.getSourceCode();
        var usingScenery = false;
        source.tokensAndComments.forEach( function( token ) {
          if ( token.value === sceneryModulePath ) {
            usingScenery = true;
          }
        } );

        if ( !usingScenery ) {
          context.report( {
            node: node,
            loc: node.loc.start,
            message: 'using HTML ' + node.callee.name + ' instead of scenery Node'
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];