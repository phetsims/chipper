// Copyright 2019, University of Colorado Boulder
/* eslint-disable */

/**
 * Lint detector for invalid text.  Checks the entire file and does not correctly report line number.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  const getBadTextTester = require( './getBadTextTester' );

  var badTextsForSimCode = [

    // babel doesn't support compiling static getters, see https://github.com/phetsims/tasks/issues/983
    ' static get ',

    // should be using dot.Util.roundSymmetric, Math.round does not treat positive and negative numbers
    // symmetrically see https://github.com/phetsims/dot/issues/35#issuecomment-113587879
    'Math.round',

    // should be using `phet.joist.random`
    'Math.random()',
    '_.shuffle(',
    '_.sample(',
    '_.random(',
    'new Random()',

    // IE doesn't support:
    'Number.parseInt(',
    'Array.prototype.find'

    // DOT/Util.toFixed or DOT/Util.toFixedNumber should be used instead of toFixed.
    // JavaScript's toFixed is notoriously buggy. Behavior differs depending on browser,
    // because the spec doesn't specify whether to round or floor.
    // TODO: comment back in and fix, https://github.com/phetsims/chipper/issues/737
    // {
    //   name: '.toFixed(',     // support regex with english names this way
    //   regex: new RegExp( '(?<!Util)\\.toFixed\\(' )
    // },
  ];

  return {
    Program: getBadTextTester( badTextsForSimCode, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];