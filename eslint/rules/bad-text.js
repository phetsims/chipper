// Copyright 2018-2019, University of Colorado Boulder
/* eslint-disable phet/bad-text */

/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */


const getBadTextTester = require( './getBadTextTester' );

module.exports = {
  create: function( context ) {

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

      // embarrassingly enough, zepumph is so bad at typing this word that he needs these lint rules, see https://github.com/phetsims/friction/issues/234
      'respones',
      'Respones',

      // Avoid string literal in assert predicate, see https://github.com/phetsims/assert/issues/7
      'assert( \'',

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
      'phetio element', // use "phet-io element" or "PhET-iO Element"
      'PhET-iO element', // use "phet-io element" or "PhET-iO Element" https://github.com/phetsims/phet-io/issues/1968
      'Phet-iO',
      { id: 'IO type', regex: /\bIO type/ }, // https://github.com/phetsims/chipper/issues/977
      // prefer PhET-iO Type name , https://github.com/phetsims/phet-io/issues/1972
      'IO Typename',
      'IO TypeName',
      'IO Type Name',

      // prefer PhET-iO Type (public name) or IOType (class name) https://github.com/phetsims/phet-io/issues/1972
      'IO Type',
      ' IO type',

      '@return ',

      // see https://thenewstack.io/words-matter-finally-tech-looks-at-removing-exclusionary-language/ and
      // https://github.com/phetsims/special-ops/issues/221
      // The regex works around github links that include a `master` branch with a slash, as well as `Ron LeMaster`, a
      // PhET team member
      {
        id: 'words matter',
        regex: /(slave|black-?list|white-?list|(?<!\/)\bmaster\b)/i
      },

      // Any instances of youtube.com should enforce that we use youtube-nocookie.com
      // https://github.com/phetsims/website/issues/1376
      // https://support.google.com/youtube/answer/171780?hl=en#zippy=%2Cturn-on-privacy-enhanced-mode
      {
        id: 'require youtube privacy enhanced mode',
        regex: /youtube(?:(?!-nocookie).)*\.com/
      },

      '../phet-lib/js/phet-lib-only-imports', // use direct imports

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

      // optionize cannot infer its type arguments, pass them like `optionize<MyOptions. . .>()()
      'optionize(',

      // In general, you should not duplicate QueryStringMachine getting phetioDebug, instead just use PhetioClient.prototype.getDebugModeEnabled(), see https://github.com/phetsims/phet-io/issues/1859
      'phetioDebug:',

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
      { id: 'Type<Parameter> (add a dot)', regex: /{[^\n:]*[A-z]<[A-z][|'<>A-z]+>[^\n:{}]*}}/ },

      // eslint disable line directives must have an explanation
      {
        id: 'eslint-disable-line directives must have explanation',
        predicate: line => !line.trim().endsWith( 'eslint-disable-line' ),

        // Report the error on the previous line so it doesn't get disabled
        lineNumberDelta: -1
      },

      // eslint disable next line directives must have an explanation
      {
        id: 'eslint-disable-next-line directives must have explanation',
        predicate: line => !line.trim().endsWith( 'eslint-disable-next-line' )
      },

      // Prefer _.assignIn() which returns the object in its type doc, https://github.com/phetsims/tasks/issues/1130
      ' = _.extend('
    ];

    return {
      Program: getBadTextTester( 'bad-text', forbiddenTextObjects, context )
    };
  }
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];