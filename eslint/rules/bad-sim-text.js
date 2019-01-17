// Copyright 2019, University of Colorado Boulder
/* eslint-disable */

/**
 * NOTE: this file is a duplicate of bad-text.js, but it is only run on sim specific code, if you are looking for
 * adding general bad text, see `./bad-text.js`
 *
 * Lint detector for invalid text.  Checks the entire file and does not correctly report line number.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  var badTextsForSimCode = [

    'Math.round',
    'Math.random',
    '_.shuffle',
    '_.sample',
    '_.random',
    'new Random()',

    // IE doesn't support:
    'Number.parseInt()',
    'Array.prototype.find'

  ];

  // NOTE: this code is duplicated in `bad-text.js`, don't edit this without updating there too
  return {
    Program: function( node ) {
      var sourceCode = context.getSourceCode();
      var text = sourceCode.text;
      badTextsForSimCode.forEach( function( badText ) {
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