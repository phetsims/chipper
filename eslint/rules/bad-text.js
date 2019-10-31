// Copyright 2018-2019, University of Colorado Boulder
/* eslint-disable bad-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function( context ) {
  'use strict';

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema
  const forbiddenTextObjects = [

    // Proper casing for *boxes

    // toolbox is one word
    'toolBox', // prefer toolbox
    'ToolBox', // prefer Toolbox
    'TOOL_BOX', // prefer TOOLBOX

    // checkbox is one word
    'checkBox', // prefer checkbox
    'CheckBox', // prefer Checkbox
    'CHECK_BOX', // prefer CHECKBOX

    // combo box is two words
    'combobox', // prefer combo box
    'Combobox', // prefer Combo Box
    'COMBOBOX', // prefer COMBO_BOX

    // In ES6, extending object causes methods to be dropped
    { id: 'extends Object ', codeTokens: [ 'extends', 'Object' ] },

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

    // TODO: this isn't yet supported with current getBadTextTester.js
    ' => { return ' // if on a one line arrow function returning something, prefer instead `() => theReturn`, see https://github.com/phetsims/chipper/issues/790
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];