// Copyright 2019, University of Colorado Boulder
/* eslint-disable bad-sim-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  var forbiddenTextObjects = [

    // babel doesn't support compiling static getters, see https://github.com/phetsims/tasks/issues/983
    { id: ' static get ', codeOnly: true, codeTokens: [ 'static', 'get' ] },

    // should be using dot.Util.roundSymmetric, Math.round does not treat positive and negative numbers
    // symmetrically see https://github.com/phetsims/dot/issues/35#issuecomment-113587879
    { id: 'Math.round(', codeOnly: true, codeTokens: [ 'Math', '.', 'round', '(' ] },

    // should be using `phet.joist.random`
    { id: 'Math.random()', codeOnly: true, codeTokens: [ 'Math', '.', 'random', '(', ')' ] },
    { id: '_.shuffle(', codeOnly: true, codeTokens: [ '_', '.', 'shuffle', '(' ] },
    { id: '_.sample(', codeOnly: true, codeTokens: [ '_', '.', 'sample', '(' ] },
    { id: '_.random(', codeOnly: true, codeTokens: [ '_', '.', 'random', '(' ] },
    { id: 'new Random()', codeOnly: true, codeTokens: [ 'new', 'Random', '(', ')' ] },

    // IE doesn't support:
    { id: 'Number.parseInt(', codeOnly: true, codeTokens: [ 'Number', '.', 'parseInt', '(' ] },
    { id: 'Array.prototype.find', codeOnly: true, codeTokens: [ 'Array', '.', 'prototype', '.', 'find' ] }

    // DOT/Util.toFixed or DOT/Util.toFixedNumber should be used instead of toFixed.
    // JavaScript's toFixed is notoriously buggy. Behavior differs depending on browser,
    // because the spec doesn't specify whether to round or floor.
    // TODO: comment back in and fix, https://github.com/phetsims/chipper/issues/737
    // {
    //   id: '.toFixed(',     // support regex with english names this way
    //   regex: new RegExp( '(?<!Util)\\.toFixed\\(' )
    // },
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];