// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to guarantee we do not use Math.sign which is not supported on IE
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2017 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    MemberExpression: function noMathSign( node ) {

      // See https://astexplorer.net/ for an interactive tool that lets you explore ASTs
      if ( node.object && node.object.name === 'Math' && node.property && node.property.name === 'sign' ) {
        context.report( {
          node: node,
          loc: node.loc.start,
          message: 'Math.sign is not supported on IE, please use DOT/Util.sign'
        } );
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];