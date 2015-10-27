// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that the PhET copyright statement is present and correct
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    Program: function checkCopyright( node ) {
      // Get the whole source code, not for node only.
      var comments = context.getSourceCode().getAllComments();

      if ( !comments || comments.length === 0 ) {
        context.report( {
          node: node,
          loc: 1,
          message: 'Incorrect copyright statement in first comment'
        } );
      }
      else {
        // second year must be between 2010 and 2099, inclusive
        if ( ! / Copyright 2002-20[1-9]\d, University of Colorado Boulder/.test( comments[ 0 ].value ) ) {
          context.report( {
            node: node,
            loc: comments[ 0 ].loc.start,
            message: 'Incorrect copyright statement in first comment'
          } );
        }
      }
    }
  };

};

module.exports.schema = [
  // JSON Schema for rule options goes here
];