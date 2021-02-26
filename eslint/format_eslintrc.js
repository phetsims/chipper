// Copyright 2021, University of Colorado Boulder

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
  extends: 'eslint:recommended', // TODO: is this needed? https://github.com/phetsims/phet-info/issues/150

  // specify that this file is the root of the eslintrc tree, so eslint won't search past this file looking for a file
  // in a parent dir
  root: true, // TODO: is this needed? https://github.com/phetsims/phet-info/issues/150

  // The new rules, overrides, etc.
  rules: {

    // enforce line breaks after opening and before closing array brackets
    // https://eslint.org/docs/rules/array-bracket-newline
    // TODO: enable? semver-major
    'array-bracket-newline': [ 'off', 'consistent' ], // object option alternative: { multiline: true, minItems: 3 }

    // enforce line breaks between array elements
    // https://eslint.org/docs/rules/array-element-newline
    // TODO: enable? semver-major
    'array-element-newline': [ 'off', { multiline: true, minItems: 3 } ],

    // enforce spacing inside single-line blocks
    // https://eslint.org/docs/rules/block-spacing
    // Leave it off because Webstorm doesn't add spacing to `() => {this.pLDChanged = true;}` to make it `() => { this.pLDChanged = true; }
    // TODO: perhaps update webstorm rules, https://github.com/phetsims/phet-info/issues/150
    // 'block-spacing': [ 'error', 'always' ],

    // enforce or disallow capitalization of the first letter of a comment
    // https://eslint.org/docs/rules/capitalized-comments
    'capitalized-comments': [ 'off', 'never', {
      line: {
        ignorePattern: '.*',
        ignoreInlineComments: true,
        ignoreConsecutiveComments: true
      },
      block: {
        ignorePattern: '.*',
        ignoreInlineComments: true,
        ignoreConsecutiveComments: true
      }
    } ],

    // enforce newline at the end of file, with no multiple empty lines
    // TODO: add to knit picky rules, https://github.com/phetsims/phet-info/issues/150
    // 'eol-last': [ 'error', 'never' ],

    // requires function names to match the name of the variable or property to which they are
    // assigned
    // https://eslint.org/docs/rules/func-name-matching
    'func-name-matching': [ 'off', 'always', {
      includeCommonJSModuleExports: false,
      considerPropertyDescriptor: true
    } ],

    // require function expressions to have a name
    // https://eslint.org/docs/rules/func-names
    // 'func-names': 'warn',

    // enforces use of function declarations or expressions
    // https://eslint.org/docs/rules/func-style
    // TODO: enable
    'func-style': [ 'off', 'expression' ],

    // enforce consistent line breaks inside function parentheses
    // https://eslint.org/docs/rules/function-paren-newline
    // TODO: https://github.com/phetsims/phet-info/issues/150 should we turn this on?
    // I disabled it for compatibility with some formatting I saw in fourier
    // 'function-paren-newline': [ 'error', 'consistent' ],

    // Blacklist certain identifiers to prevent them being used
    // https://eslint.org/docs/rules/id-blacklist
    // TODO: semver-major, remove once eslint v7.4+ is required
    'id-blacklist': 'off',

    // disallow specified identifiers
    // https://eslint.org/docs/rules/id-denylist
    'id-denylist': 'off',

    // this option enforces minimum and maximum identifier lengths
    // (variable names, property names etc.)
    'id-length': 'off',

    // require identifiers to match the provided regular expression
    'id-match': 'off',

    // Enforce the location of arrow function bodies with implicit returns
    // https://eslint.org/docs/rules/implicit-arrow-linebreak
    // 'implicit-arrow-linebreak': [ 'error', 'beside' ],

    // this option sets a specific tab width for your code
    // https://eslint.org/docs/rules/indent
    indent: [ 'error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 'first',
      outerIIFEBody: 1,

      // MemberExpression: null,
      FunctionDeclaration: {
        parameters: 'first',
        body: 1
      },
      FunctionExpression: {
        parameters: 'first',
        body: 1
      },
      CallExpression: {
        arguments: 1
      },
      ArrayExpression: 'first',
      ObjectExpression: 'first',
      ImportDeclaration: 'first',
      flatTernaryExpressions: true,

      // list derived from https://github.com/benjamn/ast-types/blob/HEAD/def/jsx.js
      ignoredNodes: [ 'ConditionalExpression' ],
      ignoreComments: false
    } ],

    // specify whether double or single quotes should be used in JSX attributes
    // https://eslint.org/docs/rules/jsx-quotes
    'jsx-quotes': [ 'off', 'prefer-double' ],

    // require a space before & after certain keywords
    'keyword-spacing': [ 'error', {
      before: true,
      after: true,
      overrides: {
        return: { after: true },
        throw: { after: true },
        case: { after: true }
      }
    } ],

    // enforce position of line comments
    // https://eslint.org/docs/rules/line-comment-position
    // TODO: enable?
    'line-comment-position': [ 'off', {
      position: 'above',
      ignorePattern: '',
      applyDefaultPatterns: true
    } ],

    // disallow mixed 'LF' and 'CRLF' as linebreaks
    // https://eslint.org/docs/rules/linebreak-style
    // This is commented out because on windows this is just noisy. Git is already set up to commit the appropriate line breaks.
    // 'linebreak-style': [ 'error', 'unix' ],

    // enforces empty lines around comments
    // PhET devs do not want this to be so strict in general
    // TODO: add to extra knit-picky rules in the future. https://github.com/phetsims/phet-info/issues/150
    // 'lines-around-comment': [ 'error', { beforeLineComment: true } ],

    // require or disallow newlines around directives
    // https://eslint.org/docs/rules/lines-around-directive
    'lines-around-directive': [ 'error', {
      before: 'always',
      after: 'always'
    } ],

    // specify the maximum depth that blocks can be nested
    'max-depth': [ 'off', 4 ],

    // specify the maximum length of a line in your program
    // https://eslint.org/docs/rules/max-len
    'max-len': [ 'off', 120, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    } ],

    // specify the max number of lines in a file
    // https://eslint.org/docs/rules/max-lines
    'max-lines': [ 'off', {
      max: 300,
      skipBlankLines: true,
      skipComments: true
    } ],

    // enforce a maximum function length
    // https://eslint.org/docs/rules/max-lines-per-function
    'max-lines-per-function': [ 'off', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true
    } ],

    // specify the maximum depth callbacks can be nested
    'max-nested-callbacks': 'off',

    // limits the number of parameters that can be used in the function declaration.
    'max-params': [ 'off', 3 ],

    // specify the maximum number of statement allowed in a function
    'max-statements': [ 'off', 10 ],

    // restrict the number of statements per line
    // https://eslint.org/docs/rules/max-statements-per-line
    'max-statements-per-line': [ 'off', { max: 1 } ],

    // enforce a particular style for multiline comments
    // https://eslint.org/docs/rules/multiline-comment-style
    'multiline-comment-style': [ 'off', 'starred-block' ],

    // require multiline ternary
    // https://eslint.org/docs/rules/multiline-ternary
    // TODO: enable?
    'multiline-ternary': [ 'off', 'never' ],

    // allow/disallow an empty newline after var statement
    'newline-after-var': 'off',

    // https://eslint.org/docs/rules/newline-before-return
    'newline-before-return': 'off',

    // enforces new line after each method call in the chain to make it
    // more readable and easy to maintain
    // https://eslint.org/docs/rules/newline-per-chained-call
    'newline-per-chained-call': [ 'error', { ignoreChainWithDepth: 4 } ],

    // disallow use of bitwise operators
    // https://eslint.org/docs/rules/no-bitwise
    'no-bitwise': 'error', // SO MANY ERRORS IN SCENERY

    // disallow use of the continue statement
    // https://eslint.org/docs/rules/no-continue
    // 'no-continue': 'error',

    // disallow comments inline after code
    'no-inline-comments': 'off',

    // disallow if as the only statement in an else block
    // https://eslint.org/docs/rules/no-lonely-if
    // 'no-lonely-if': 'error',

    // disallow un-paren'd mixes of different operators
    // https://eslint.org/docs/rules/no-mixed-operators
    // 'no-mixed-operators': [ 'error', {
    //
    //   // the list of arithmetic groups disallows mixing `%` and `**`
    //   // with other arithmetic operators.
    //   groups: [
    //     [ '%', '**' ],
    //     [ '%', '+' ],
    //     [ '%', '-' ],
    //     [ '%', '*' ],
    //     [ '%', '/' ],
    //     [ '/', '*' ],
    //     [ '&', '|', '<<', '>>', '>>>' ],
    //     [ '==', '!=', '===', '!==' ],
    //     [ '&&', '||' ],
    //   ],
    //   allowSamePrecedence: false
    // } ],

    // disallow use of chained assignment expressions
    // https://eslint.org/docs/rules/no-multi-assign
    // 'no-multi-assign': [ 'error' ],

    // disallow multiple empty lines, only one newline at the end, and no new lines at the beginning
    // https://eslint.org/docs/rules/no-multiple-empty-lines
    'no-multiple-empty-lines': [ 'error', { max: 1, maxBOF: 0, maxEOF: 0 } ],

    // disallow negated conditions
    // https://eslint.org/docs/rules/no-negated-condition
    'no-negated-condition': 'off',

    // disallow nested ternary expressions
    // 'no-nested-ternary': 'error',

    // disallow the use of ternary operators
    'no-ternary': 'off',

    // disallow dangling underscores in identifiers
    // https://eslint.org/docs/rules/no-underscore-dangle
    // 'no-underscore-dangle': [ 'error', {
    //   allow: [],
    //   allowAfterThis: false,
    //   allowAfterSuper: false,
    //   enforceInMethodNames: true
    // } ],

    // disallow the use of Boolean literals in conditional expressions
    // also, prefer `a || b` over `a ? a : b`
    // https://eslint.org/docs/rules/no-unneeded-ternary
    'no-unneeded-ternary': [ 'error', { defaultAssignment: false } ],

    // get rid of extra spaces within lines of code
    // https://eslint.org/docs/rules/no-multi-spaces
    'no-multi-spaces': 'error',

    // enforce line breaks between braces
    // https://eslint.org/docs/rules/object-curly-newline
    'object-curly-newline': [ 'error', {
      ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
      ObjectPattern: { minProperties: 4, multiline: true, consistent: true },
      ImportDeclaration: { minProperties: 4, multiline: true, consistent: true },
      ExportDeclaration: { minProperties: 4, multiline: true, consistent: true }
    } ],

    // enforce "same line" or "multiple line" on object properties.
    // https://eslint.org/docs/rules/object-property-newline
    // 'object-property-newline': [ 'error', {
    //   allowAllPropertiesOnSameLine: true,
    // } ],

    // require assignment operator shorthand where possible or prohibit it entirely
    // https://eslint.org/docs/rules/operator-assignment
    'operator-assignment': [ 'error', 'always' ],

    // Requires operator at the beginning of the line in multiline statements
    // https://eslint.org/docs/rules/operator-linebreak
    // 'operator-linebreak': [ 'error', 'after', { overrides: { '=': 'none' } } ],

    // disallow padding within blocks
    // 'padded-blocks': [ 'error', {
    //   blocks: 'never',
    //   classes: 'never',
    //   switches: 'never',
    // }, {
    //   allowSingleLineBlocks: true,
    // } ],

    // Require or disallow padding lines between statements
    // https://eslint.org/docs/rules/padding-line-between-statements
    'padding-line-between-statements': 'off',

    // Disallow the use of Math.pow in favor of the ** operator
    // https://eslint.org/docs/rules/prefer-exponentiation-operator
    // TODO: enable, semver-major when eslint 5 is dropped
    'prefer-exponentiation-operator': 'off',

    // do not require jsdoc
    // https://eslint.org/docs/rules/require-jsdoc
    'require-jsdoc': 'off',

    // requires object keys to be sorted
    'sort-keys': [ 'off', 'asc', { caseSensitive: false, natural: true } ],

    // sort variables within the same declaration block
    'sort-vars': 'off',

    // require or disallow a space immediately following the // or /* in a comment
    // https://eslint.org/docs/rules/spaced-comment
    // TODO: https://github.com/phetsims/phet-info/issues/150
    // SR is opinionated about having a space after line comment slashes, but I saw places in fourier where that
    // isn't happening, so this is commented out for now.
    // 'spaced-comment': [ 'error', 'always', {
    //   line: {
    //     exceptions: [ '-', '+' ],
    //     markers: [ '=', '!', '/' ] // space here to support sprockets directives, slash for TS /// comments
    //   },
    //   block: {
    //     exceptions: [ '-', '+' ],
    //     markers: [ '=', '!', ':', '::' ], // space here to support sprockets directives and flow comment types
    //     balanced: true
    //   }
    // } ],

    // require regex literals to be wrapped in parentheses
    'wrap-regex': 'off'
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  }
};