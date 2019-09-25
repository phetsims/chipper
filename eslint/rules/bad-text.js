// Copyright 2018-2019, University of Colorado Boulder
/* eslint-disable */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  const getBadTextTester = require( './getBadTextTester' );

  var badTexts = [

    // Proper casing for *boxes
    'toolBox',
    'ToolBox',
    'CheckBox',
    'checkBox',
    'Combobox',
    'combobox',

    // In ES6, extending object causes methods to be dropped
    'extends Object ',

    // Forbid common duplicate words
    ' the the ',
    ' a a ',
    'dipose', // happens more than you'd think

    // For phet-io use PHET_IO in constants
    'PHETIO',
    'Phet-iO',
    ' Phet ',
    'phetio element', // use "phet-io element" or "PhET-iO element"
    'Phet-iO',

    '@return ',
    ' => { return ', // if on a one line arrow function returning something, prefer instead `() => theReturn`, see https://github.com/phetsims/chipper/issues/790
  ];

  return {
    Program: getBadTextTester( badTexts, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];