// Copyright 2015-2021, University of Colorado Boulder

'use strict';

/**
 * The base eslint configuration for the PhET projects.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

  // Use all of the default rules from eslint, unless overridden below.
  extends: 'eslint:recommended', // TODO: This can be removed once https://github.com/phetsims/chipper/issues/814 is complete

  // specify that this file is the root of the eslintrc tree, so eslint won't search past this file looking for a file
  // in a parent dir
  root: true,

  // The rules are organized like they are in the list at https://eslint.org/docs/rules/
  // First by type, then alphabetically within type
  // Explicitly list all rules so it is easy to see what's here and to keep organized
  rules: {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Errors
    //

    // enforce "for" loop update clause moving the counter in the right direction.
    'for-direction': 'error',

    // enforce `return` statements in getters
    'getter-return': 'error',

    // disallow using an async function as a Promise executor
    'no-async-promise-executor': 'off', // TODO: Enable this rule, see https://github.com/phetsims/perennial/issues/216

    // disallow `await` inside of loops
    'no-await-in-loop': 'off', // We use await in loops all the time in build tools

    // disallow comparing against -0
    'no-compare-neg-zero': 'error',

    // disallow assignment operators in conditional expressions
    'no-cond-assign': 'error',

    // disallow the use of `console`
    'no-console': 'off', // We like to be able to commit console.log

    // disallow constant expressions in conditions
    'no-constant-condition': 'error',

    // disallow control characters in regular expressions
    'no-control-regex': 'error',

    // disallow the use of `debugger`
    'no-debugger': 'error',

    // disallow duplicate arguments in `function` definitions
    'no-dupe-args': 'error',

    // disallow duplicate conditions in if-else-if chains
    'no-dupe-else-if': 'error',

    // disallow duplicate keys in object literals
    'no-dupe-keys': 'error',

    // disallow duplicate case labels
    'no-duplicate-case': 'error',

    // disallow empty block statements
    'no-empty': 'error',

    // disallow empty character classes in regular expressions
    'no-empty-character-class': 'error',

    // disallow reassigning exceptions in `catch` clauses
    'no-ex-assign': 'error',

    // disallow unnecessary boolean casts
    'no-extra-boolean-cast': 'error',

    // disallow unnecessary parentheses
    'no-extra-parens': 'off', // we find that extraneous parentheses sometimes improve readability

    // disallow unnecessary semicolons
    'no-extra-semi': 'error',

    // disallow reassigning `function` declarations
    'no-func-assign': 'error',

    // disallow assigning to imported bindings
    'no-import-assign': 'error',

    // disallow variable or `function` declarations in nested blocks
    'no-inner-declarations': 'error',

    // disallow invalid regular expression strings in `RegExp` constructors
    'no-invalid-regexp': 'error',

    // disallow irregular whitespace
    'no-irregular-whitespace': 'error',

    // disallow literal numbers that lose precision
    'no-loss-of-precision': 'error',

    // disallow characters which are made with multiple code points in character class syntax
    'no-misleading-character-class': 'error',

    // disallow calling global object properties as functions
    'no-obj-calls': 'error',

    // disallow returning values from Promise executor functions
    'no-promise-executor-return': 'off', // We turn this rule off so you can use an arrow function as an executor

    // disallow calling some `Object.prototype` methods directly on objects
    'no-prototype-builtins': 'off', // TODO: explain why this rule is off, see https://github.com/phetsims/chipper/issues/814

    // disallow multiple spaces in regular expressions
    'no-regex-spaces': 'error',

    // disallow returning values from setters
    'no-setter-return': 'error',

    // disallow sparse arrays
    'no-sparse-arrays': 'error',

    // disallow template literal placeholder syntax in regular strings
    'no-template-curly-in-string': 'error',

    // disallow confusing multiline expressions
    'no-unexpected-multiline': 'error', // Avoid code that looks like two expressions but is actually one

    // disallow unreachable code after `return`, `throw`, `continue`, and `break` statements
    'no-unreachable': 'error',

    // disallow loops with a body that allows only one iteration
    'no-unreachable-loop': 'off', // TODO: We should enable this rule, see https://github.com/phetsims/chipper/issues/814

    // disallow control flow statements in `finally` blocks
    'no-unsafe-finally': 'error',

    // disallow negating the left operand of relational operators
    'no-unsafe-negation': 'error',

    // disallow use of optional chaining in contexts where the `undefined` value is not allowed
    'no-unsafe-optional-chaining': 'error',

    // disallow useless backreferences in regular expressions
    'no-useless-backreference': 'error',

    // disallow assignments that can lead to race conditions due to usage of `await` or `yield`
    'require-atomic-updates': 'off', // TODO: can we turn this on? see https://github.com/phetsims/chipper/issues/814

    // require calls to `isNaN()` when checking for `NaN`
    'use-isnan': 'error',

    // enforce comparing `typeof` expressions against valid strings
    'valid-typeof': 'error',

    // Match with 5.0 recommended rules after our upgrade to 6.0, see https://eslint.org/docs/user-guide/migrating-to-6.0.0
    'no-useless-catch': 'off',

    // specify whether backticks, double or single quotes should be used (fixable)
    quotes: [ 'error', 'single' ],

    // No dangling commas, see https://github.com/phetsims/tasks/issues/940
    'comma-dangle': 'error',

    // require or disallow use of semicolons instead of ASI (fixable)
    semi: [ 'error', 'always' ],

    'bad-text': 'error',

    // Custom rule for checking the copyright.
    copyright: 'error',

    // Custom rule for checking TODOs have issues
    'todo-should-have-issue': 'error',

    // Custom rule for ensuring that images and text use scenery node
    'no-html-constructors': 'error',

    // enforce one true brace style
    'brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],

    // Custom rule for avoiding instanceof Array.
    'no-instanceof-array': 'error',

    // Custom rule for keeping import statements on a single line.
    'single-line-import': 'error',

    // method declarations must have a visibility annotation
    'visibility-annotation': 'error',

    // Enumerations should be named like classes/types
    'enumeration-casing': 'error',

    // key and value arguments to namespace.register() must match
    'namespace-match': 'error',

    // disallow declaration of variables that are not used in the code (recommended)
    // Overridden to allow unused args
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none'
      }
    ],

    // error when let is used but the variable is never reassigned, see https://github.com/phetsims/tasks/issues/973
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false
      }
    ],

    // require the use of === and !== (fixable)
    eqeqeq: 'error',

    // specify curly brace conventions for all control statements
    curly: 'error',

    // disallow use of arguments.caller or arguments.callee
    'no-caller': 'error',

    // disallow use of the new operator when not part of an assignment or comparison
    'no-new': 'error',

    // controls location of Use Strict Directives
    // strict: 2, // TODO: restore this, see https://github.com/phetsims/chipper/issues/820

    // encourages use of dot notation whenever possible
    'dot-notation': 'error',

    // disallow use of bitwise operators https://eslint.org/docs/rules/no-bitwise
    'no-bitwise': 'error',

    // disallow adding to native types
    'no-extend-native': 'error',

    // disallow use of assignment in return statement
    'no-return-assign': 'error',

    // disallow comparisons where both sides are exactly the same
    'no-self-compare': 'error',

    // disallow unnecessary .call() and .apply()
    'no-useless-call': 'error',

    // disallow use of undefined when initializing variables
    'no-undef-init': 'error',

    // phet-specific require statement rules
    'require-statement-match': 'error',
    'phet-io-require-contains-ifphetio': 'error',

    // Require @public/@private for this.something = result;
    'property-visibility-annotation': 'off',
    'no-property-in-require-statement': 'error',

    // disallow assignment within variable declaration, see https://github.com/phetsims/chipper/issues/794
    'no-multi-assign-on-declaration': 'error',

    // get rid of extra spaces within lines of code
    'no-multi-spaces': [ 'error', { ignoreEOLComments: true } ],

    // permit only one var declaration per line, see #390
    'one-var': [ 'error', 'never' ],

    // require radix argument for parseInt
    radix: 'error',

    // require default case for switch statements
    'default-case': 'error',

    // do not allow fall-through cases in switch statements
    'no-fallthrough': 'error',

    // consistently use 'self' as the alias for 'this'
    'consistent-this': [ 'error', 'self' ],

    // require a capital letter for constructors
    'new-cap': [ 'error', {
      newIsCap: true,
      newIsCapExceptionPattern: '^(options|this|window)\\.\\w+', // Allow constructors to be passed through options.
      newIsCapExceptions: [ 'rsync', 'jimp', 'Math.seedrandom' ],
      capIsNew: false,
      capIsNewExceptions: [ 'Immutable.Map', 'Immutable.Set', 'Immutable.List' ]
    } ],

    // disallow too many empty lines
    'no-multiple-empty-lines': [ 'error', { max: 2, maxBOF: 0, maxEOF: 1 } ],

    // don't escape characters that don't need to be escaped
    'no-useless-escape': 'error',

    // never allow object shorthand for properties, functions are ok.
    'phet-object-shorthand': 'error',

    // disallow parens surrounding single args in arrow functions
    'arrow-parens': [ 'error', 'as-needed' ],

    'no-trailing-spaces': [ 'error', { skipBlankLines: true, ignoreComments: true } ],

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

    // requires function names to match the name of the variable or property to which they are assigned
    // https://eslint.org/docs/rules/func-name-matching
    'func-name-matching': [ 'error', 'always', {
      includeCommonJSModuleExports: false,
      considerPropertyDescriptor: true
    } ],

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
    phet: 'readonly',

    // allow assertions
    assert: 'readonly',

    // allow slow assertions
    assertSlow: 'readonly',

    phetio: 'readonly',

    // underscore, lodash
    _: 'readonly',

    // jQuery
    $: 'readonly',

    document: 'readonly',

    // for linting Node.js code
    global: 'readonly',

    // QUnit
    QUnit: 'readonly',

    // as used in Gruntfile.js
    module: 'readonly',

    // Misc
    QueryStringMachine: 'readonly',

    // sole/tween.js
    TWEEN: 'readonly',

    window: 'readonly',

    handlePlaybackEvent: 'readonly'
  }
};