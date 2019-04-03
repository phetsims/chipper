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
    'no-useless-escape': 0,

    // never allow object shorthand for properties, functions are ok.
    'phet-object-shorthand': 2
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8
  },
  globals: {

    // read-only globals ---------------------------------

    phet: false,

    // allow assertions
    assert: false,

    // allow slow assertions
    assertSlow: false,

    phetio: false,

    // underscore, lodash
    _: false,

    // jQuery
    $: false,

    // require.js
    define: false,

    document: false,

    // for linting Node.js code
    global: false,

    // QUnit
    QUnit: false,

    // as used in Gruntfile.js
    module: false,

    // Misc
    QueryStringMachine: false,

    // require.js
    require: false,

    // sole/tween.js
    TWEEN: false,

    window: false
  }
};