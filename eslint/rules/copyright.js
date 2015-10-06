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

        // sample comment:
        //{"type":"Line","value":" Copyright 2002-2015, University of Colorado Boulder","range":[0,54],"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":54}}}
        if ( comments[ 0 ].value !== ' Copyright 2002-2015, University of Colorado Boulder' &&
             comments[ 0 ].value !== ' Copyright 2002-2014, University of Colorado Boulder' &&
             comments[ 0 ].value !== ' Copyright 2002-2013, University of Colorado Boulder' ) {

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