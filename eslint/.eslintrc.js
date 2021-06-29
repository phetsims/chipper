// Copyright 2015-2021, University of Colorado Boulder

'use strict';

/**
 * The base eslint configuration for the PhET projects.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

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
    'no-async-promise-executor': 'error',

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
    'no-prototype-builtins': 'off', // We prefer `foo.hasOwnProperty("bar");` to `Object.prototype.hasOwnProperty.call(foo, "bar");`

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
    'no-unreachable-loop': 'error',

    // disallow control flow statements in `finally` blocks
    'no-unsafe-finally': 'error',

    // disallow negating the left operand of relational operators
    'no-unsafe-negation': 'error',

    // disallow use of optional chaining in contexts where the `undefined` value is not allowed
    'no-unsafe-optional-chaining': 'error',

    // disallow useless backreferences in regular expressions
    'no-useless-backreference': 'error',

    // disallow assignments that can lead to race conditions due to usage of `await` or `yield`
    'require-atomic-updates': 'off', // TODO: Enable: 6 fails, can we turn this on? see https://github.com/phetsims/chipper/issues/814

    // require calls to `isNaN()` when checking for `NaN`
    'use-isnan': 'error',

    // enforce comparing `typeof` expressions against valid strings
    'valid-typeof': 'error',

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Best Practices
    //

    // enforce getter and setter pairs in objects and classes
    'accessor-pairs': 'off', // Only 17 fails, but I'm not sure we need this.  Perhaps once it bites us we will change our mind?

    // enforce `return` statements in callbacks of array methods
    'array-callback-return': 'error',

    // enforce the use of variables within the scope they are defined
    'block-scoped-var': 'off', // We have too much old code with var i being used across several loops.

    // enforce that class methods utilize `this`
    'class-methods-use-this': 'off', // We have many overrideable methods that just throw an error

    // enforce a maximum cyclomatic complexity allowed in a program
    complexity: 'off', // We have around 242 offenders as of March, 2021

    // require `return` statements to either always or never specify values
    'consistent-return': 'error',

    // enforce consistent brace style for all control statements
    curly: 'error',

    // require `default` cases in `switch` statements
    'default-case': 'error',

    // enforce default clauses in switch statements to be last
    'default-case-last': 'error',

    // enforce default parameters to be last
    'default-param-last': 'error',

    // enforce consistent newlines before and after dots
    'dot-location': 'off', // We use WebStorm formatting which moves lower dots to the left

    // enforce dot notation whenever possible
    'dot-notation': 'error',

    // require the use of `===` and `!==`
    eqeqeq: 'error',

    // require grouped accessor pairs in object literals and classes
    'grouped-accessor-pairs': 'off', // In scenery, we group all the getters together, then the setters together

    // require `for-in` loops to include an `if` statement
    'guard-for-in': 'off', // This hasn't bit us yet

    // enforce a maximum number of classes per file
    'max-classes-per-file': 'off', // have as many as you need!

    // disallow the use of `alert`, `confirm`, and `prompt`
    'no-alert': 'off', // We sometimes use this when necessary

    // disallow the use of `arguments.caller` or `arguments.callee`
    'no-caller': 'error',

    // disallow lexical declarations in case clauses
    'no-case-declarations': 'error',

    // disallow returning value from constructor
    'no-constructor-return': 'error',

    // disallow division operators explicitly at the beginning of regular expressions
    'no-div-regex': 'error',

    // disallow `else` blocks after `return` statements in `if` statements
    'no-else-return': 'off', // Allow the extra else for symmetry

    // disallow empty functions
    'no-empty-function': 'off', // It is natural and convenient to specify empty functions instead of having to share a lodash _.noop

    // disallow empty destructuring patterns
    'no-empty-pattern': 'error',

    // disallow `null` comparisons without type-checking operators
    'no-eq-null': 'error',

    // disallow the use of `eval()`
    'no-eval': 'error',

    // disallow extending native types
    'no-extend-native': 'error',

    // disallow unnecessary calls to `.bind()`
    'no-extra-bind': 'error',

    // disallow unnecessary labels
    'no-extra-label': 'error',

    // disallow fallthrough of `case` statements
    'no-fallthrough': 'error',

    // disallow leading or trailing decimal points in numeric literals
    'no-floating-decimal': 'error',

    // disallow assignments to native objects or read-only global variables
    'no-global-assign': 'error',

    // disallow shorthand type conversions
    'no-implicit-coercion': 'off', // We like using !!value and number+''.  Maybe one day we will turn this rule on

    // disallow declarations in the global scope
    'no-implicit-globals': 'error',

    // disallow the use of `eval()`-like methods
    'no-implied-eval': 'error',

    // disallow `this` keywords outside of classes or class-like objects
    'no-invalid-this': 'off', // We have too much old code that uses functions with this (outside of classes)

    // disallow the use of the `__iterator__` property
    'no-iterator': 'error',

    // disallow labeled statements
    'no-labels': 'error',

    // disallow unnecessary nested blocks
    'no-lone-blocks': 'off', // Even though lone blocks are currently rare for our project, we agree they are appropriate in some situations.  Details are in https://github.com/phetsims/chipper/issues/1026

    // disallow function declarations that contain unsafe references inside loop statements
    'no-loop-func': 'off', // It seems we are dealing with this safely, we have 38 occurrences on March 2021

    // disallow magic numbers
    'no-magic-numbers': 'off', // We have many magic numbers

    // disallow multiple spaces
    'no-multi-spaces': [ 'error', { ignoreEOLComments: true } ],

    // disallow multiline strings
    'no-multi-str': 'error',

    // disallow `new` operators outside of assignments or comparisons
    'no-new': 'error',

    // disallow `new` operators with the `Function` object
    'no-new-func': 'error',

    // disallow `new` operators with the `String`, `Number`, and `Boolean` objects
    'no-new-wrappers': 'error',

    // disallow `\8` and `\9` escape sequences in string literals
    'no-nonoctal-decimal-escape': 'error',

    // disallow octal literals
    'no-octal': 'error',

    // disallow octal escape sequences in string literals
    'no-octal-escape': 'error',

    // disallow reassigning `function` parameters
    'no-param-reassign': 'off', // We reassign options frequently

    // disallow the use of the `__proto__` property
    'no-proto': 'error',

    // disallow variable redeclaration
    'no-redeclare': 'error',

    // disallow certain properties on certain objects
    'no-restricted-properties': 'error',

    // disallow assignment operators in `return` statements
    'no-return-assign': 'error',

    // disallow unnecessary `return await`
    'no-return-await': 'off', // TODO: Enable: 19 fails, https://github.com/phetsims/chipper/issues/814 this seems like a good rule to enable

    // disallow `javascript:` urls
    'no-script-url': 'error',

    // disallow assignments where both sides are exactly the same
    'no-self-assign': 'error',

    // disallow comparisons where both sides are exactly the same
    'no-self-compare': 'error',

    // disallow comma operators
    'no-sequences': 'off', // TODO: Enable: 2 failures, https://github.com/phetsims/chipper/issues/814 we should turn this rule on

    // disallow throwing literals as exceptions
    'no-throw-literal': 'off', // TODO: Enable: 1 failure, https://github.com/phetsims/chipper/issues/814 we should turn this rule on

    // disallow unmodified loop conditions
    'no-unmodified-loop-condition': 'off', // TODO: Enable: 1 failure https://github.com/phetsims/chipper/issues/814 we should turn this rule on.  Only 1 fail.

    // disallow unused expressions
    'no-unused-expressions': 'off', // This blocks things like circuitLayerNode && circuitLayerNode.circuit.circuitChangedEmitter.removeListener( updateText );

    // disallow unused labels
    'no-unused-labels': 'error',

    // disallow unnecessary calls to `.call()` and `.apply()`
    'no-useless-call': 'error',

    // disallow unnecessary `catch` clauses
    'no-useless-catch': 'error',

    // disallow unnecessary concatenation of literals or template literals
    'no-useless-concat': 'error',

    // disallow unnecessary escape characters
    'no-useless-escape': 'error',

    // disallow redundant return statements
    'no-useless-return': 'error',

    // disallow `void` operators
    'no-void': 'error',

    // disallow specified warning terms in comments
    'no-warning-comments': 'off', // We don't want TODOs to be lint errors

    // disallow `with` statements
    'no-with': 'error',

    // enforce using named capture group in regular expression
    'prefer-named-capture-group': 'off', // We have many occurrences in yotta/js/apacheParsing.js

    // require using Error objects as Promise rejection reasons
    'prefer-promise-reject-errors': 'off', // TODO: Enable: 14 failures https://github.com/phetsims/chipper/issues/814 this seems like it should be on

    // disallow use of the `RegExp` constructor in favor of regular expression literals
    'prefer-regex-literals': 'off', // new RegExp() looks natural to me

    // enforce the consistent use of the radix argument when using `parseInt()`
    radix: 'error',

    // disallow async functions which have no `await` expression
    'require-await': 'off', // TODO: Enable: 53 fails, https://github.com/phetsims/chipper/issues/814 this seems like it should be on

    // enforce the use of `u` flag on RegExp
    'require-unicode-regexp': 'off', // TODO: Discuss: 272 fails or so, https://github.com/phetsims/chipper/issues/814 is there a good reason for this rule?

    // require `var` declarations be placed at the top of their containing scope
    'vars-on-top': 'off',

    // require parentheses around immediate `function` invocations
    'wrap-iife': 'off', // Not our style

    // require or disallow "Yoda" conditions
    yoda: 'error',

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Strict Mode
    //

    // controls location of Use Strict Directives
    strict: 'off', // TODO: Enable: Discuss: 338 occurrences. restore this, see https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/814

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables
    //

    // require or disallow initialization in variable declarations
    'init-declarations': 'off', // 1286 failures as of March 2021

    // disallow deleting variables
    'no-delete-var': 'error',

    // disallow labels that share a name with a variable
    'no-label-var': 'error',

    // disallow specified global variables
    'no-restricted-globals': 'error',

    // disallow variable declarations from shadowing variables declared in the outer scope
    'no-shadow': 'off', // We have 462 shadows as of March, 2021

    // disallow identifiers from shadowing restricted names
    'no-shadow-restricted-names': 'error',

    // disallow the use of undeclared variables unless mentioned in `/*global */` comments
    'no-undef': 'error',

    // disallow initializing variables to `undefined`
    'no-undef-init': 'error',

    // disallow the use of `undefined` as an identifier
    'no-undefined': 'off', // 608 fails as of March 2021

    // disallow unused variables
    'no-unused-vars': [ // Overridden to allow unused args
      'error',
      {
        vars: 'all',
        args: 'none'
      }
    ],

    // disallow the use of variables before they are defined
    'no-use-before-define': 'off', // We often declare auxiliary classes at the bottom of a file, which are used in the primary class

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Stylistic Issues
    //

    // enforce linebreaks after opening and before closing array brackets
    'array-bracket-newline': 'off',

    // enforce consistent spacing inside array brackets
    'array-bracket-spacing': [ 'error', 'always' ],

    // enforce line breaks after each array element
    'array-element-newline': 'off',

    // disallow or enforce spaces inside of blocks after opening block and before closing block
    'block-spacing': 'off', // Our code style supports e.g.,: if ( !isFinite( newState.getTotalEnergy() ) ) { throw new Error( 'not finite' );}

    // enforce consistent brace style for blocks
    'brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],

    // enforce camelcase naming convention
    camelcase: 'off', // 3512 occurrences March 2021

    // enforce or disallow capitalization of the first letter of a comment
    'capitalized-comments': 'off',

    // require or disallow trailing commas
    'comma-dangle': 'error', // see https://github.com/phetsims/tasks/issues/940

    // enforce consistent spacing before and after commas
    'comma-spacing': [ 'error', { before: false, after: true } ],

    // enforce consistent comma style
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

    // enforce consistent spacing inside computed property brackets
    'computed-property-spacing': [ 'error', 'always' ],

    // enforce consistent naming when capturing the current execution context
    'consistent-this': [ 'error', 'self' ],

    // require or disallow newline at the end of files
    'eol-last': 'off', // 5000 problems in March 2021.  SR would prefer 'eol-last': [ 'error', 'never' ], in his code

    // require or disallow spacing between function identifiers and their invocations
    'func-call-spacing': [ 'error', 'never' ],

    // require function names to match the name of the variable or property to which they are assigned
    'func-name-matching': [ 'error', 'always', {
      includeCommonJSModuleExports: false,
      considerPropertyDescriptor: true
    } ],

    // require or disallow named `function` expressions
    'func-names': 'off', // we sometimes name our functions for debugging

    // enforce the consistent use of either `function` declarations or expressions
    'func-style': 'off', // 1179 occurrences on March 2021

    // enforce line breaks between arguments of a function call
    'function-call-argument-newline': [ 'off', 'consistent' ], // Not PhET's style

    // enforce consistent line breaks inside function parentheses
    'function-paren-newline': 'off', // we often prefer parameters on the same line

    // disallow specified identifiers
    'id-denylist': 'error',

    // enforce minimum and maximum identifier lengths
    'id-length': 'off',

    // require identifiers to match a specified regular expression
    'id-match': 'error',

    // enforce the location of arrow function bodies
    'implicit-arrow-linebreak': 'off', // OK to line break in arrow functions if it improves readability.

    // enforce consistent indentation
    indent: 'off',

    // enforce the consistent use of either double or single quotes in JSX attributes
    'jsx-quotes': 'error',

    // enforce consistent spacing between keys and values in object literal properties
    'key-spacing': [ 'error', { beforeColon: false, afterColon: true } ],

    // enforce consistent spacing before and after keywords
    'keyword-spacing': [ 'error', {
      before: true,
      after: true,
      overrides: {
        case: { after: true }, // default
        switch: { after: false },
        catch: { after: false }
      }
    } ],

    // enforce position of line comments
    'line-comment-position': 'off',

    // enforce consistent linebreak style
    'linebreak-style': 'off', // Windows may check out a different line style than mac, so we cannot test this on local working copies cross-platform

    // require empty lines around comments
    'lines-around-comment': 'off', // SR Would like this rule enabled in his repos like so: 'lines-around-comment': [ 'error', { beforeLineComment: true } ]

    // require or disallow an empty line between class members
    'lines-between-class-members': [ 'error', 'always', { exceptAfterSingleLine: false } ],

    // enforce a maximum depth that blocks can be nested
    'max-depth': 'off', // Go for it!

    // enforce a maximum line length
    'max-len': 'off', // Not a strict rule

    // enforce a maximum number of lines per file
    'max-lines': 'off', // Go for it!

    // enforce a maximum number of lines of code in a function
    'max-lines-per-function': 'off', // Go for it!

    // enforce a maximum depth that callbacks can be nested
    'max-nested-callbacks': 'error',

    // enforce a maximum number of parameters in function definitions
    'max-params': 'off',

    // enforce a maximum number of statements allowed in function blocks
    'max-statements': 'off',

    // enforce a maximum number of statements allowed per line
    'max-statements-per-line': 'off', // 700+ occurrences in March 2021

    // enforce a particular style for multiline comments
    'multiline-comment-style': 'off',

    // enforce newlines between operands of ternary expressions
    'multiline-ternary': 'off', // We use all styles of ternaries

    // require constructor names to begin with a capital letter
    'new-cap': [ 'error', {
      newIsCap: true,
      newIsCapExceptionPattern: '^(options|this|window)\\.\\w+', // Allow constructors to be passed through options.
      newIsCapExceptions: [ 'rsync', 'jimp', 'Math.seedrandom' ],
      capIsNew: false,
      capIsNewExceptions: [ 'Immutable.Map', 'Immutable.Set', 'Immutable.List' ]
    } ],

    // enforce or disallow parentheses when invoking a constructor with no arguments
    'new-parens': 'error',

    // require a newline after each call in a method chain
    'newline-per-chained-call': 'off', // should be flexible

    // disallow `Array` constructors
    'no-array-constructor': 'error',

    // disallow bitwise operators
    'no-bitwise': 'error',

    // disallow `continue` statements
    'no-continue': 'off', // 57 continues as of March 2021

    // disallow inline comments after code
    'no-inline-comments': 'off',

    // disallow `if` statements as the only statement in `else` blocks
    'no-lonely-if': 'off', // Sometimes this seems more readable or symmetric

    // disallow mixed binary operators
    'no-mixed-operators': 'off',  // 3+2/4 should be allowed

    // disallow mixed spaces and tabs for indentation
    'no-mixed-spaces-and-tabs': 'error',

    // disallow use of chained assignment expressions
    'no-multi-assign': 'off', // SR would like to disable this in his sims, see https://github.com/phetsims/chipper/issues/814

    // disallow multiple empty lines
    'no-multiple-empty-lines': [ 'error', { max: 2, maxBOF: 0, maxEOF: 1 } ],

    // disallow negated conditions
    'no-negated-condition': 'off', // sometimes a negated condition is clearer

    // disallow nested ternary expressions
    'no-nested-ternary': 'off', // Go for it!

    // disallow `Object` constructors
    'no-new-object': 'error',

    // disallow the unary operators `++` and `--`
    'no-plusplus': 'off',

    // disallow specified syntax
    'no-restricted-syntax': [
      'off', // TODO: Add back in https://github.com/phetsims/chipper/issues/1009

      // TODO: https://github.com/phetsims/phet-info/issues/ should we turn this on?
      // It showed an error in Fourier so I disabled it
      // {
      //   selector: 'ForInStatement',
      //   message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      // },
      {
        selector: 'ForOfStatement',
        message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.'
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],

    // disallow all tabs
    'no-tabs': 'error',

    // disallow ternary operators
    'no-ternary': 'off', // PhET loves the ternary

    // disallow trailing whitespace at the end of lines
    'no-trailing-spaces': [ 'error', { skipBlankLines: true, ignoreComments: true } ],

    // disallow dangling underscores in identifiers
    'no-underscore-dangle': 'off', // We often use this for private variables

    // disallow ternary operators when simpler alternatives exist
    'no-unneeded-ternary': 'error',

    // disallow whitespace before properties
    'no-whitespace-before-property': 'error',

    // enforce the location of single-line statements
    'nonblock-statement-body-position': [ 'error', 'beside', { overrides: {} } ],

    // enforce consistent line breaks inside braces
    'object-curly-newline': 'error',

    // enforce consistent spacing inside braces
    'object-curly-spacing': [ 'error', 'always' ],

    // enforce placing object properties on separate lines
    'object-property-newline': 'off',

    // enforce variables to be declared either together or separately in functions
    'one-var': [ 'error', 'never' ], // See #390

    // require or disallow newlines around variable declarations
    'one-var-declaration-per-line': [ 'error', 'always' ],

    // require or disallow assignment operator shorthand where possible
    'operator-assignment': 'off', // Operator assignment can often be harder to read

    // enforce consistent linebreak style for operators
    'operator-linebreak': 'off',

    // require or disallow padding within blocks
    'padded-blocks': 'off', // 109k fails

    // require or disallow padding lines between statements
    'padding-line-between-statements': 'error',

    // disallow the use of `Math.pow` in favor of the `**` operator
    'prefer-exponentiation-operator': 'off', // Math.pow() seems very clear.

    // disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead.
    'prefer-object-spread': 'off', // The fix for this says "unexpected token", so let's go without it.

    // require quotes around object literal property names
    'quote-props': [ 'error', 'as-needed', { keywords: false, unnecessary: true, numbers: false } ],

    // enforce the consistent use of either backticks, double, or single quotes
    quotes: [ 'error', 'single' ],

    // require or disallow semicolons instead of ASI
    semi: [ 'error', 'always' ],

    // enforce consistent spacing before and after semicolons
    'semi-spacing': [ 'error', { before: false, after: true } ],

    // enforce location of semicolons
    'semi-style': [ 'error', 'last' ],

    // require object keys to be sorted
    'sort-keys': 'off',

    // require variables within the same declaration block to be sorted
    'sort-vars': 'off',

    // enforce consistent spacing before blocks
    'space-before-blocks': 'error',

    // enforce consistent spacing before `function` definition opening parenthesis
    'space-before-function-paren': [ 'error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    } ],

    // enforce consistent spacing inside parentheses
    'space-in-parens': [ 'error', 'always' ],

    // require spacing around infix operators
    'space-infix-ops': 'error',

    // enforce consistent spacing before or after unary operators
    'space-unary-ops': [ 'error', {
      words: true,
      nonwords: false,
      overrides: {}
    } ],

    // enforce consistent spacing after the `//` or `/*` in a comment
    'spaced-comment': 'off',

    // enforce spacing around colons of switch statements
    'switch-colon-spacing': [ 'error', { after: true, before: false } ],

    // require or disallow spacing between template tags and their literals
    'template-tag-spacing': [ 'error', 'never' ],

    // require or disallow Unicode byte order mark (BOM)
    'unicode-bom': [ 'error', 'never' ],

    // require parenthesis around regex literals
    'wrap-regex': 'off', // It already seems pretty ambiguous to me, but then again we only have 17 occurrences at the moment.

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ECMAScript 6
    //

    // require braces around arrow function bodies
    'arrow-body-style': 'off', // OK to have braces or not braces

    // require parentheses around arrow function arguments
    'arrow-parens': [ 'error', 'as-needed' ],

    // enforce consistent spacing before and after the arrow in arrow functions
    'arrow-spacing': 'error',

    // require `super()` calls in constructors
    'constructor-super': 'error',

    // enforce consistent spacing around `*` operators in generator functions
    'generator-star-spacing': 'error',

    // disallow reassigning class members
    'no-class-assign': 'error',

    // disallow arrow functions where they could be confused with comparisons
    'no-confusing-arrow': 'off', // 31 occurrences, didn't seem too bad

    // disallow reassigning `const` variables
    'no-const-assign': 'error',

    // disallow duplicate class members
    'no-dupe-class-members': 'error',

    // disallow duplicate module imports
    'no-duplicate-imports': 'off', // https://github.com/phetsims/chipper/issues/814 2 fails, enable this rule

    // disallow `new` operators with the `Symbol` object
    'no-new-symbol': 'error',

    // disallow specified names in exports
    'no-restricted-exports': 'error',

    // disallow specified modules when loaded by `import`
    'no-restricted-imports': 'error',

    // disallow `this`/`super` before calling `super()` in constructors
    'no-this-before-super': 'error',

    // disallow unnecessary computed property keys in objects and classes
    'no-useless-computed-key': 'error',

    // disallow unnecessary constructors
    'no-useless-constructor': 'off', // We determined the useless constructors are good for documentation and clarity.

    // disallow renaming import, export, and destructured assignments to the same name
    'no-useless-rename': 'error',

    // require `let` or `const` instead of `var`
    'no-var': 'error',

    // require or disallow method and property shorthand syntax for object literals
    'object-shorthand': [ 'off', 'never' ], // PhET has a rule phet-object-shorthand that detects this in object literals

    // require using arrow functions for callbacks
    'prefer-arrow-callback': 'error',

    // require `const` declarations for variables that are never reassigned after declared
    'prefer-const': [ // error when let is used but the variable is never reassigned, see https://github.com/phetsims/tasks/issues/973
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false
      }
    ],

    // require destructuring from arrays and/or objects
    'prefer-destructuring': 'off', // const {CURVE_X_RANGE} = CalculusGrapherConstants; seems worse than const CURVE_X_RANGE = CalculusGrapherConstants.CURVE_X_RANGE;

    // disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
    'prefer-numeric-literals': 'error',

    // require rest parameters instead of `arguments`
    'prefer-rest-params': 'off', // TODO: Enable: 2 fails, https://github.com/phetsims/chipper/issues/814 we have 2 fails and we should fix them

    // require spread operators instead of `.apply()`
    'prefer-spread': 'off', // TODO: Enable: 21 fails, https://github.com/phetsims/chipper/issues/814 we have 99 fails, but we should fix them

    // require template literals instead of string concatenation
    'prefer-template': 'off', // We decided it is convenient to sometimes use string concatenation, see discussion in https://github.com/phetsims/chipper/issues/1027

    // require generator functions to contain `yield`
    'require-yield': 'error',

    // enforce spacing between rest and spread operators and their expressions
    'rest-spread-spacing': 'error',

    // enforce sorted import declarations within modules
    'sort-imports': 'off', // Webstorm and ESLint sorting rules don't align

    // require symbol descriptions
    'symbol-description': 'error',

    // require or disallow spacing around embedded expressions of template strings
    'template-curly-spacing': 'error',

    // require or disallow spacing around the `*` in `yield*` expressions
    'yield-star-spacing': 'error',

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Custom Rules
    //

    'bad-text': 'error',

    // Custom rule for checking the copyright.
    copyright: 'error',

    // Custom rule for checking TODOs have issues
    'todo-should-have-issue': 'error',

    // Custom rule for ensuring that images and text use scenery node
    'no-html-constructors': 'error',

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

    // phet-specific require statement rules
    'require-statement-match': 'error',
    'phet-io-require-contains-ifphetio': 'error',

    // Require @public/@private for this.something = result;
    'property-visibility-annotation': 'off',
    'no-property-in-require-statement': 'error',

    // disallow assignment within variable declaration, see https://github.com/phetsims/chipper/issues/794
    'no-multi-assign-on-declaration': 'error',

    // never allow object shorthand for properties, functions are ok.
    'phet-object-shorthand': 'error',

    // disallow space between function identifier and application
    'no-spaced-func': 'error'

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

    Prism: 'readonly',

    // sole/tween.js
    TWEEN: 'readonly',

    window: 'readonly',

    handlePlaybackEvent: 'readonly',

    pako: 'readonly'
  }
};