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
        // years must be between 2000 and 2099, inclusive.  A script can be used to check that the dates
        // match the GitHub creation and last-modified dates
        var isDateRangeOK = /^ Copyright 20\d\d-20\d\d, University of Colorado Boulder$/.test( comments[ 0 ].value );
        var isSingleDateOK = /^ Copyright 20\d\d, University of Colorado Boulder$/.test( comments[ 0 ].value );
        if ( !isDateRangeOK && !isSingleDateOK ) {
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