// Copyright 2018-2019, University of Colorado Boulder
/* eslint-disable bad-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-env node */
'use strict';

module.exports = function( context ) {

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
    'PHET-IO',
    'Phet-iO',
    ' Phet ',
    'phetio element', // use "phet-io element" or "PhET-iO element"
    'Phet-iO',

    '@return ',

    'Util = require( \'',// Utils should now be plural, see https://github.com/phetsims/tasks/issues/966

    // if on a one line arrow function returning something, prefer instead `() => theReturn`, see https://github.com/phetsims/chipper/issues/790
    ' => { return ',

    'define( function( require ) {', // use define( require => { to standardize before es6 module migration

    // optional 'options' should use brackets and required 'config' shouldn't use brackets, see https://github.com/phetsims/chipper/issues/859
    '@param {Object} options',
    '@param {Object} [config]',

    {
      id: 'Import from statements require a *.js suffix',
      predicate: line => {
        if ( line.trim().indexOf( 'import ' ) === 0 && line.indexOf( ' from ' ) > 0 && line.indexOf( '.js' ) === -1 ) {
          return false;
        }
        else {
          return true;
        }
      }
    },

    {
      id: 'Import statements require a *.js suffix',
      predicate: line => {
        if ( line.trim().indexOf( 'import \'' ) === 0 && line.indexOf( ';' ) >= 0 && line.indexOf( '.js' ) === -1 ) {
          return false;
        }
        else {
          return true;
        }
      }
    }
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];