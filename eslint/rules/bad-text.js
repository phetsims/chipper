// Copyright 2018-2019, University of Colorado Boulder
/* eslint-disable bad-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */


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

    'Overriden', // should have 2 "d"s
    'overriden', // should have 2 "d"s

    'iFrame', // should be iframe

    // event.keyCode according to spec, rather than event.keycode
    'keycode',

    // prefer hotkey (one word)
    'hot key',
    'hotKey',
    'HotKey',
    'HOT_KEY',

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
    { id: 'IO type', regex: /\bIO type/ }, // https://github.com/phetsims/chipper/issues/977

    '@return ',

    'Util = require( \'', // Utils should now be plural, see https://github.com/phetsims/tasks/issues/966

    // if on a one line arrow function returning something, prefer instead `() => theReturn`, see https://github.com/phetsims/chipper/issues/790
    ' => { return ',

    'define( function( require ) {', // use define( require => { to standardize before es6 module migration

    // optional 'options' should use brackets and required 'config' shouldn't use brackets, see https://github.com/phetsims/chipper/issues/859
    '@param {Object} options',
    '@param {Object} [config]',

    // PhET prefers to use the term "position" to refer to the physical (x,y) position of objects.
    // The lint rule can be disabled for occurrences where we do prefer locationProperty, for instance if we
    // had a sim about people that are from three different named locations.
    'locationProperty',

    {
      id: 'Import from statements require a *.js suffix',
      predicate: line => {
        if ( line.trim().indexOf( 'import ' ) === 0 && line.indexOf( ' from ' ) > 0 && line.indexOf( '.js' ) === -1 ) {
          return false;
        }
        return true;
      }
    },

    {
      id: 'Import statements require a *.js suffix',
      predicate: line => {
        if ( line.trim().indexOf( 'import \'' ) === 0 && line.indexOf( ';' ) >= 0 && line.indexOf( '.js' ) === -1 ) {
          return false;
        }
        return true;
      }
    },

    {
      id: 'Export statements should not have a register call',
      predicate: line => {
        if ( line.trim().indexOf( 'export default' ) === 0 && line.indexOf( '.register(' ) >= 0 ) {
          return false;
        }
        return true;
      }
    },

    // Should have a period before "<", see https://github.com/phetsims/chipper/issues/1005 and https://github.com/phetsims/chipper/issues/1003
    { id: 'Type<Parameter> (add a dot)', regex: /{[^\n:]*[A-z]<[A-z][|'<>A-z]+>[^\n:{}]*}}/ }
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];