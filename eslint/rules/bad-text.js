// Copyright 2018, University of Colorado Boulder

/**
 * Lint detector for invalid text.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  var badTexts = [
    'tool' + 'Box', // intentionally split to avoid getting caught in the lint, split manually because lint apparently rules cannot be disabled in their declarations
    'Tool' + 'Box', // intentionally split to avoid getting caught in the lint, split manually because lint apparently rules cannot be disabled in their declarations
    'Check' + 'Box', // intentionally split to avoid getting caught in the lint, split manually because lint apparently rules cannot be disabled in their declarations
    'check' + 'Box' // intentionally split to avoid getting caught in the lint, split manually because lint apparently rules cannot be disabled in their declarations
  ];

  var checkNode = function( node, text ) {
    badTexts.forEach( function( badText ) {
      if ( text.indexOf( badText ) >= 0 ) {
        context.report( {
          node: node,
          message: 'Bad text: ' + badText + ' in ' + node.type
        } );
      }
    } );
  };
  return {
    Identifier: function checkCopyright( node ) {
      checkNode( node, node.name );
    },
    Literal: function checkLiteral( node ) {
      checkNode( node, node.raw );
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];