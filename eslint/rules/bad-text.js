// Copyright 2018, University of Colorado Boulder
/* eslint-disable */

/**
 * Lint detector for invalid text.  Checks the entire file and does not correctly report line number.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  var badTexts = [
    'toolBox',
    'ToolBox',
    'CheckBox',
    'checkBox',
    'extends Object',
    ' the the '
  ];

  return {
    Program: function( node ) {
      var sourceCode = context.getSourceCode();
      var text = sourceCode.text;
      badTexts.forEach( function( badText ) {
        if ( text.indexOf( badText ) >= 0 ) {
          context.report( {
            node: node,
            message: 'File contains bad text: \'' + badText + '\''
          } );
        }
      } )
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];