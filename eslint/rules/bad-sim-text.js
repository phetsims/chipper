// Copyright 2019, University of Colorado Boulder
/* eslint-disable bad-sim-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

'use strict';

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // should be using dot.Utils.roundSymmetric, Math.round does not treat positive and negative numbers
    // symmetrically see https://github.com/phetsims/dot/issues/35#issuecomment-113587879
    { id: 'Math.round(', codeTokens: [ 'Math', '.', 'round', '(' ] },

    // should be using `DOT/dotRandom`
    { id: 'Math.random()', codeTokens: [ 'Math', '.', 'random', '(', ')' ] },
    { id: '_.shuffle(', codeTokens: [ '_', '.', 'shuffle', '(' ] },
    { id: '_.sample(', codeTokens: [ '_', '.', 'sample', '(' ] },
    { id: '_.random(', codeTokens: [ '_', '.', 'random', '(' ] },
    { id: 'new Random()', codeTokens: [ 'new', 'Random', '(', ')' ] },

    // IE doesn't support:
    { id: 'Number.parseInt(', codeTokens: [ 'Number', '.', 'parseInt', '(' ] },
    { id: 'Array.prototype.find', codeTokens: [ 'Array', '.', 'prototype', '.', 'find' ] },

    // Use merge instead of _.extend for combining options/config. Leave out first letter to allow for `options = `
    // and `sliderOptions = _.extend` to both be caught.
    'ptions = _.extend(',
    'onfig = _.extend(',

    // ParallelDOM.pdomOrder should not be mutated, instead only set with `setPDOMOrder`
    '.pdomOrder.push(',

    // Should import dotRandom instead of using the namespace
    'phet.dot.dotRandom',

    // Prefer using Pointer.isTouchLike() to help support Pen. This is not set in stone, please see
    // https://github.com/phetsims/scenery/issues/1156 and feel free to discuss if there are usages you want to support.
    ' instanceof Touch ',

    // Should have a period before "<", see https://github.com/phetsims/chipper/issues/1005
    { id: 'Type<Parameter>', regex: /{[^\n ]*\b[A-z]+<[A-z]+>/ },

    // In sims, don't allow setTimout and setInterval calls coming from window, see https://github.com/phetsims/phet-info/issues/59
    {
      id: 'setTimeout(',
      regex: /(window\.| )setTimeout\(/
    },
    {
      id: 'setInterval(',
      regex: /(window\.| )setInterval\(/
    },

    // DOT/Utils.toFixed or DOT/Utils.toFixedNumber should be used instead of toFixed.
    // JavaScript's toFixed is notoriously buggy. Behavior differs depending on browser,
    // because the spec doesn't specify whether to round or floor.
    {
      id: '.toFixed(', // support regex with english names this way
      regex: new RegExp( '(?<!Utils)\\.toFixed\\(' ) // NOTE: eslint parsing breaks when using regex syntax like `/regex/`
    }
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];