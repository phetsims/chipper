// Copyright 2015-2019, University of Colorado Boulder

/* eslint-env node */
'use strict';

/**
 * The base eslint configuration for the project
 * values for rules:
 * 0 - no error
 * 1 - warn
 * 2 - error
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

  // Use all of the default rules from eslint, unless overridden below.
  extends: 'eslint:recommended',

  // specify that this file is the root of the eslintrc tree, so eslint won't search past this file looking for a file
  // in a parent dir
  root: true,

  // The new rules, overrides, etc.
  rules: {

    // Permit console.log statements (we have a lot of them)
    // TODO: Find a way to make sure no console.log statements make it to production.  Can use the no-console rule
    // but we want to be able to use console.log during development.
    'no-console': 0,

    // specify whether backticks, double or single quotes should be used (fixable)
    quotes: [
      2,
      'single'
    ],

    // No dangling commas, see https://github.com/phetsims/tasks/issues/940
    'comma-dangle': 2,

    // Prohibit for...of statements
    'no-restricted-syntax': [
      2,
      {
        selector: 'ForOfStatement',
        message: 'Babel transpiles for...of to use Symbol which is not supported on all our platforms.'
      }
    ],

    // require or disallow use of semicolons instead of ASI (fixable)
    semi: [
      2,
      'always'
    ],
    'bad-text': 2,

    // Custom rule for checking the copyright.
    copyright: 2,

    // Custom rule for checking TODOs have issues
    'todo-should-have-issue': 2,

    // Custom rule for ensuring that images and text use scenery node
    'no-html-constructors': 2,

    // Custom rule for avoiding Math.sign which is not supported on IE
    'no-math-sign': 2,

    // Custom rule for avoiding instanceof Array.
    'no-instanceof-array': 2,

    // disallow declaration of variables that are not used in the code (recommended)
    // Overriden to allow unused args
    'no-unused-vars': [
      2,
      {
        vars: 'all',
        args: 'none'
      }
    ],
    // error when let is used but the variable is never reassigned, see https://github.com/phetsims/tasks/issues/973
    'prefer-const': [
      2,
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false
      }
    ],

    // require the use of === and !== (fixable)
    eqeqeq: 2,

    // specify curly brace conventions for all control statements
    curly: 2,

    // disallow use of arguments.caller or arguments.callee
    'no-caller': 2,

    // disallow use of the new operator when not part of an assignment or comparison
    'no-new': 2,

    // controls location of Use Strict Directives
    strict: 2,

    // Avoid code that looks like two expressions but is actually one
    'no-unexpected-multiline': 2,

    // encourages use of dot notation whenever possible
    'dot-notation': 2,

    // disallow adding to native types
    'no-extend-native': 2,

    // disallow use of assignment in return statement
    'no-return-assign': 2,

    // disallow comparisons where both sides are exactly the same
    'no-self-compare': 2,

    // disallow unnecessary .call() and .apply()
    // TODO: Under discussion in https://github.com/phetsims/scenery-phet/issues/193
    //    'no-useless-call': 2,

    // disallow use of undefined when initializing variables
    'no-undef-init': 2,

    //
    'require-statement-match': 2,
    'phet-io-require-contains-ifphetio': 2,
    'require-tandem-support': 0,

    // Require @public/@private for this.something = result;
    'property-visibility-annotation': 0,
    'no-property-in-require-statement': 2,
    // permit only one var declaration per line, see #390
    'one-var': [
      2,
      'never'
    ],
    'string-require-statement-match': 2,

    // require radix argument for parseInt
    radix: 2,

    // require default case for switch statements
    'default-case': 2,

    // do not allow fall-through cases in switch statements
    'no-fallthrough': 2,

    // consistently use 'self' as the alias for 'this'
    'consistent-this': [
      2,
      'self'
    ],

    // added for 5.14.1 update but should likely be removed once discussed in https://github.com/phetsims/chipper/issues/726
    'no-useless-escape': 0
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8
  },
  globals: {

    // Global symbols that are permissible to overwrite -----------------------
    process: true,

    // allow assertions
    assert: true,

    // allow slow assertions
    assertSlow: true,

    // scenery logging levels
    sceneryLog: true,

    // scenery accessibility levels
    sceneryAccessibilityLog: true,

    // we actually polyfill this, so allow it to be set
    Float32Array: true,

    phet: true,
    phetio: true,
    aqua: true,

    // For use in aqua tests
    // underscore, lodash
    _: true,

    // read-only globals ---------------------------------

    // Javascript Set
    Set: false,

    // jQuery
    $: false,

    // for full screen
    ActiveXObject: false,

    //for debugging on ipad
    alert: false,

    // for Mocha tests
    afterEach: false,

    // backbone is currently run outside of requirejs
    Backbone: false,

    // for Mocha tests
    beforeEach: false,

    // BigRational
    bigRat: false,

    // DOM.js
    Blob: false,

    // Box2D physics engine
    Box2D: false,

    Buffer: false,

    canvg: false,

    clarinet: false,

    clearTimeout: false,

    console: false,

    // d3.js data visualization library
    d3: false,

    // require.js
    define: false,

    // for Mocha unit tests
    describe: false,

    document: false,

    // For qunit
    dot: false,

    equal: false,

    // For file loading, see SaveLoadNode in Energy Skate Park: Basics
    FileReader: false,

    // for linting Node.js code
    global: false,

    // jshashes library, for hashing strings (screenshot comparison)
    Hashes: false,

    // for HTML entity parsing
    he: false,

    // for HTML => JSON parsing
    himalaya: false,

    // for hightlighting
    hljs: false,

    //for web audio
    Howl: false,

    HTMLCanvasElement: false,
    HTMLImageElement: false,

    // for CODAP or other Concord communication
    iframePhone: false,

    // DOM.js
    Image: false,

    // for Mocha unit tests
    it: false,

    // QUnit
    kite: false,

    // for using native Map
    Map: false,

    // QUnit
    QUnit: false,

    // For KaTeX
    katex: false,

    // For setting location.href to save to local file, see http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    location: false,

    // LZ-string, for compressing and decompressing strings
    LZString: false,

    // PhET-iO
    Metacog: false,

    // as used in Gruntfile.js
    module: false,

    // For Mobile Safari detection, see http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
    navigator: false,

    // Numeric library used in energy skate park
    numeric: false,

    ok: false,
    PIXI: false,

    // For poly2tri triangulation library
    poly2tri: false,

    // Misc
    QueryStringMachine: false,

    // require.js
    require: false,

    scenery: false,

    // For @mrdoob's stats + frame rate readout component
    Stats: false,

    // qunit
    test: false,

    // For three.js 3d things
    THREE: false,

    // sole/tween.js
    TWEEN: false,

    Uint16Array: false,
    Uint32Array: false,

    // for khronos webgl-debug.js debugging utilities
    WebGLDebugUtils: false,

    // for WebSocket communication
    WebSocket: false,

    window: false,

    // allow ajax requests directly
    XMLHttpRequest: false,

    toast: false,
    Fourier: false
  }
};