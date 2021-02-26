// Copyright 2015-2019, University of Colorado Boulder

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

    // Match with 5.0 recommended rules after our upgrade to 6.0, see https://eslint.org/docs/user-guide/migrating-to-6.0.0
    'no-async-promise-executor': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-catch': 'off',

    // specify whether backticks, double or single quotes should be used (fixable)
    quotes: [
      2,
      'single'
    ],

    // No dangling commas, see https://github.com/phetsims/tasks/issues/940
    'comma-dangle': 2,

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

    // enforce one true brace style
    'brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],

    // Custom rule for avoiding instanceof Array.
    'no-instanceof-array': 2,

    // Custom rule for keeping import statements on a single line.
    'single-line-import': 2,

    // method declarations must have a visibility annotation
    'visibility-annotation': 2,

    // Enumerations should be named like classes/types
    'enumeration-casing': 2,

    // key and value arguments to namespace.register() must match
    'namespace-match': 2,

    // disallow declaration of variables that are not used in the code (recommended)
    // Overridden to allow unused args
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
    // strict: 2, // TODO: restore this, see https://github.com/phetsims/chipper/issues/820

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
    'no-useless-call': 2,

    // disallow use of undefined when initializing variables
    'no-undef-init': 2,

    // phet-specific require statement rules
    'require-statement-match': 2,
    'phet-io-require-contains-ifphetio': 2,

    // Require @public/@private for this.something = result;
    'property-visibility-annotation': 0,
    'no-property-in-require-statement': 2,

    // disallow assignment within variable declaration, see https://github.com/phetsims/chipper/issues/794
    'no-multi-assign-on-declaration': 2,

    // permit only one var declaration per line, see #390
    'one-var': [
      2,
      'never'
    ],

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

    // require a capital letter for constructors
    'new-cap': [ 'error', {
      newIsCap: true,
      newIsCapExceptionPattern: '^(options|this|window)\\.\\w+', // Allow constructors to be passed through options.
      newIsCapExceptions: [ 'rsync', 'jimp', 'Math.seedrandom' ],
      capIsNew: false,
      capIsNewExceptions: [ 'Immutable.Map', 'Immutable.Set', 'Immutable.List' ]
    } ],

    // don't escape characters that don't need to be escaped
    'no-useless-escape': 2,

    // never allow object shorthand for properties, functions are ok.
    'phet-object-shorthand': 2,

    // disallow parens surrounding single args in arrow functions
    'arrow-parens': [ 2, 'as-needed' ],

    'no-trailing-spaces': [ 2, { skipBlankLines: true, ignoreComments: true } ],

    // enforce spacing inside array brackets
    'array-bracket-spacing': [ 'error', 'always' ],

    // enforce spacing before and after comma
    'comma-spacing': [ 'error', { before: false, after: true } ],

    // enforce one true comma style
    'comma-style': [ 'error', 'last', { // good
      exceptions: {
        ArrayExpression: false,
        ArrayPattern: false,
        ArrowFunctionExpression: false,
        CallExpression: false,
        FunctionDeclaration: false,
        FunctionExpression: false,
        ImportDeclaration: false,
        ObjectExpression: false,
        ObjectPattern: false,
        VariableDeclaration: false,
        NewExpression: false
      }
    } ],

    // disallow padding inside computed properties
    'computed-property-spacing': [ 'error', 'always' ],

    // https://eslint.org/docs/rules/function-call-argument-newline
    // TODO: enable, semver-minor, once eslint v6.2 is required (which is a major)
    'function-call-argument-newline': [ 'off', 'consistent' ],

    // enforce spacing between functions and their invocations
    // https://eslint.org/docs/rules/func-call-spacing
    'func-call-spacing': [ 'error', 'never' ],

    // enforces spacing between keys and values in object literal properties
    'key-spacing': [ 'error', { beforeColon: false, afterColon: true } ],

    // require a space before & after certain keywords
    'keyword-spacing': [ 'error', {
      before: true,
      after: true,
      overrides: {
        case: { after: true }, // default
        switch: { after: false },
        catch: { after: false }
      }
    } ],

    // require or disallow an empty line between class members
    // https://eslint.org/docs/rules/lines-between-class-members
    'lines-between-class-members': [ 'error', 'always', { exceptAfterSingleLine: false } ],

    // disallow the omission of parentheses when invoking a constructor with no arguments
    // https://eslint.org/docs/rules/new-parens
    'new-parens': 'error',

    // disallow use of the Array constructor
    'no-array-constructor': 'error',

    // disallow mixed spaces and tabs for indentation
    'no-mixed-spaces-and-tabs': 'error',

    // disallow use of the Object constructor
    'no-new-object': 'error',

    'no-template-curly-in-string': 2,

    // disallow space between function identifier and application
    'no-spaced-func': 'error',

    // disallow tab characters entirely
    'no-tabs': 'error',

    // disallow whitespace before properties
    // https://eslint.org/docs/rules/no-whitespace-before-property
    'no-whitespace-before-property': 'error',

    // enforce the location of single-line statements
    // https://eslint.org/docs/rules/nonblock-statement-body-position
    'nonblock-statement-body-position': [ 'error', 'beside', { overrides: {} } ],

    // require padding inside curly braces
    'object-curly-spacing': [ 'error', 'always' ],

    // require a newline around variable declaration
    // https://eslint.org/docs/rules/one-var-declaration-per-line
    'one-var-declaration-per-line': [ 'error', 'always' ],

    // require quotes around object literal property names
    // https://eslint.org/docs/rules/quote-props.html
    'quote-props': [ 'error', 'as-needed', { keywords: false, unnecessary: true, numbers: false } ],

    // enforce spacing before and after semicolons
    'semi-spacing': [ 'error', { before: false, after: true } ],

    // Enforce location of semicolons
    // https://eslint.org/docs/rules/semi-style
    'semi-style': [ 'error', 'last' ],

    // require or disallow space before blocks
    'space-before-blocks': 'error',

    // require or disallow space before function opening parenthesis
    // https://eslint.org/docs/rules/space-before-function-paren
    'space-before-function-paren': [ 'error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    } ],

    // require or disallow spaces inside parentheses
    'space-in-parens': [ 'error', 'always' ],

    // require spaces around operators
    'space-infix-ops': 'error',

    // Require or disallow spaces before/after unary operators
    // https://eslint.org/docs/rules/space-unary-ops
    'space-unary-ops': [ 'error', {
      words: true,
      nonwords: false,
      overrides: {}
    } ],

    // Enforce spacing around colons of switch statements
    // https://eslint.org/docs/rules/switch-colon-spacing
    'switch-colon-spacing': [ 'error', { after: true, before: false } ],

    // Require or disallow spacing between template tags and their literals
    // https://eslint.org/docs/rules/template-tag-spacing
    'template-tag-spacing': [ 'error', 'never' ],

    // require or disallow the Unicode Byte Order Mark
    // https://eslint.org/docs/rules/unicode-bom
    'unicode-bom': [ 'error', 'never' ]

    //
    // // disallow certain syntax forms
    // // https://eslint.org/docs/rules/no-restricted-syntax
    // // TODO: Add back in https://github.com/phetsims/chipper/issues/1009
    // 'no-restricted-syntax': [
    //   'error',
    //
    //   // TODO: https://github.com/phetsims/phet-info/issues/ should we turn this on?
    //   // It showed an error in Fourier so I disabled it
    //   // {
    //   //   selector: 'ForInStatement',
    //   //   message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
    //   // },
    //   {
    //     selector: 'ForOfStatement',
    //     message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.'
    //   },
    //   {
    //     selector: 'LabeledStatement',
    //     message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
    //   },
    //   {
    //     selector: 'WithStatement',
    //     message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
    //   }
    // ]
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  },
  globals: {

    // globals that should never be accessed ---------------------------------

    // Using window.event is most likely a bug, instead the event should be passed through via a parameter, discovered in https://github.com/phetsims/scenery/issues/1053
    event: 'off',

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

    document: false,

    // for linting Node.js code
    global: false,

    // QUnit
    QUnit: false,

    // as used in Gruntfile.js
    module: false,

    // Misc
    QueryStringMachine: false,

    // sole/tween.js
    TWEEN: false,

    window: false,

    handlePlaybackEvent: false
  }
};