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

    'Math.round',
    'Math.random',
    '_.shuffle',
    '_.sample',
    '_.random',
    'new Random()',

    // IE doesn't support:
    'Number.parseInt()',
    'Array.prototype.find',

    // support regex with english names this way
    {
      name: '.toFixed(',
      regex: new RegExp( '(?<!Util)\\.toFixed\\(' )
    },
  ];

  return {
    Program: getBadTextTester( badTextsForSimCode, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];