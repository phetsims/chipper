// Copyright 2019-2022, University of Colorado Boulder


/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // should be using phet.dot.Utils.roundSymmetric, Math.round does not treat positive and negative numbers
    // symmetrically see https://github.com/phetsims/dot/issues/35#issuecomment-113587879
    { id: 'Math.round(', codeTokens: [ 'Math', '.', 'round', '(' ] },

    // should be using `DOT/dotRandom`
    { id: 'Math.random()', codeTokens: [ 'Math', '.', 'random', '(', ')' ] },
    { id: '_.shuffle(', codeTokens: [ '_', '.', 'shuffle', '(' ] },
    { id: '_.sample(', codeTokens: [ '_', '.', 'sample', '(' ] },
    { id: '_.random(', codeTokens: [ '_', '.', 'random', '(' ] },
    { id: 'new Random()', codeTokens: [ 'new', 'Random', '(', ')' ] },

    // You can use parseInt if you need a non base 10 radix
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

    // Prevent accidental importing of files from the TypeScript build output directory
    'chipper/dist',

    // Relying on these in sim code can break PhET-iO playback, instead use Sim.dimensionProperty, see https://github.com/phetsims/joist/issues/768
    'window.innerWidth',
    'window.innerHeight',

    // These are types that can be inferred by the common code and provided arguments
    'new Enumeration<',
    'new EnumerationProperty<',

    // Voicing utterances should be registered with a Node for "voicing visibility", using Voicing.alertUtterance asserts
    // that. See https://github.com/phetsims/scenery/issues/1403
    'voicingUtteranceQueue.addToBack',

    // Please use Text/RichText.STRING_PROPERTY_TANDEM_NAME when appropriate (though not all usages apply here, and
    // you can ignore this rule), https://github.com/phetsims/scenery/issues/1451#issuecomment-1270576831
    '\'stringProperty\'',

    // Just pass these through, they work with structured cloning as is! See https://github.com/phetsims/tandem/issues/280
    ' NumberIO.toStateObject',
    ' NumberIO.fromStateObject',
    ' BooleanIO.toStateObject',
    ' BooleanIO.fromStateObject',
    ' StringIO.toStateObject',
    ' StringIO.fromStateObject',

    // In sims, don't allow setTimout and setInterval calls coming from window, see https://github.com/phetsims/phet-info/issues/59
    {
      id: 'setTimeout(',
      regex: /(window\.| )setTimeout\(/
    },
    {
      id: 'setInterval(',
      regex: /(window\.| )setInterval\(/
    },

    // Decided on during developer meeting, in regards to https://github.com/phetsims/scenery/issues/1324, use `{ Type }`
    // import syntax from SCENERY/imports.js
    {
      id: 'should import from SCENERY/imports.js instead of directly',
      regex: /import.*from.*\/scenery\/(?!js\/imports.js)/
    },

    // Decided on during developer meeting, in regards to https://github.com/phetsims/scenery/issues/1324, use `{ Type }`
    // import syntax from KITE/imports.js
    {
      id: 'should import from KITE/imports.js instead of directly',
      regex: /import.*from.*\/kite\/(?!js\/imports.js)/
    },

    // DOT/Utils.toFixed or DOT/Utils.toFixedNumber should be used instead of toFixed.
    // JavaScript's toFixed is notoriously buggy. Behavior differs depending on browser,
    // because the spec doesn't specify whether to round or floor.
    {
      id: '.toFixed(', // support regex with english names this way
      regex: new RegExp( '(?<!Utils)\\.toFixed\\(' ) // NOTE: eslint parsing breaks when using regex syntax like `/regex/`
    },

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
      id: 'Prefer "Standard PhET-iO Wrapper to "standard wrapper"',
      regex: /[Ss][Tt][Aa][Nn][Dd][Aa][Rr][Dd][- _][Ww][Rr][Aa][Pp][Pp][Ee][Rr]/
    }
  ];

  return {
    Program: getBadTextTester( 'bad-sim-text', forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];