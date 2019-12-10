// Copyright 2019, University of Colorado Boulder
/* eslint-disable bad-sim-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env node */
'use strict';

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // babel doesn't support compiling static getters, see https://github.com/phetsims/tasks/issues/983
    { id: ' static get ', codeTokens: [ 'static', 'get' ] },

    // should be using dot.Util.roundSymmetric, Math.round does not treat positive and negative numbers
    // symmetrically see https://github.com/phetsims/dot/issues/35#issuecomment-113587879
    { id: 'Math.round(', codeTokens: [ 'Math', '.', 'round', '(' ] },

    // should be using `phet.joist.random`
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
    'onfig = _.extend('

    // In sims, don't allow setTimout and setInterval calls coming from window, see https://github.com/phetsims/phet-info/issues/59
    // TODO: comment back in when all lint errors are taken care of, https://github.com/phetsims/phet-info/issues/59
    // {
    //   id: 'setTimeout(',
    //   regex: /(window\.| )setTimeout\(/
    // },
    // {
    //   id: 'setInterval(',
    //   regex: /(window\.| )setInterval\(/
    // }

    // DOT/Util.toFixed or DOT/Util.toFixedNumber should be used instead of toFixed.
    // JavaScript's toFixed is notoriously buggy. Behavior differs depending on browser,
    // because the spec doesn't specify whether to round or floor.
    // TODO: comment back in when all lint errors are taken care of, https://github.com/phetsims/chipper/issues/737
    // {
    //   id: '.toFixed(',     // support regex with english names this way
    //   regex: /(?<!Util)\.toFixed\(/
    // }
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];