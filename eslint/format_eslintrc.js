// Copyright 2021, University of Colorado Boulder

'use strict';

/**
 * Additional rules for formatting js. See ./README.md for more info.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

  // SR and MK deleted rules that we think we would never use.
  rules: {
    'object-curly-newline': [ 'error', {
      ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
      ObjectPattern: { minProperties: 4, multiline: true, consistent: true },
      ImportDeclaration: { minProperties: 4, multiline: true, consistent: true },
      ExportDeclaration: { minProperties: 4, multiline: true, consistent: true }
    } ],

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

    'no-multi-spaces': 'error',

    // enforce line breaks after opening and before closing array brackets
    // https://eslint.org/docs/rules/array-bracket-newline
    // 'array-bracket-newline': [ 'off', 'consistent' ], // object option alternative: { multiline: true, minItems: 3 }

    // enforce line breaks between array elements
    // https://eslint.org/docs/rules/array-element-newline
    // 'array-element-newline': [ 'off', { multiline: true, minItems: 3 } ],

    // enforce spacing inside single-line blocks
    // https://eslint.org/docs/rules/block-spacing
    // Leave it off because Webstorm doesn't add spacing to `() => {this.pLDChanged = true;}` to make it `() => { this.pLDChanged = true; }
    // perhaps update webstorm rules
    // 'block-spacing': [ 'error', 'always' ],

    // enforce consistent line breaks inside function parentheses
    // https://eslint.org/docs/rules/function-paren-newline
    // I disabled it for compatibility with some formatting I saw in fourier
    // 'function-paren-newline': [ 'error', 'consistent' ],

    // Enforce the location of arrow function bodies with implicit returns
    // https://eslint.org/docs/rules/implicit-arrow-linebreak
    // 'implicit-arrow-linebreak': [ 'error', 'beside' ],

    // specify the maximum length of a line in your program
    // https://eslint.org/docs/rules/max-len
    // 'max-len': [ 'off', 120, 2, {
    //   ignoreUrls: true,
    //   ignoreComments: false,
    //   ignoreRegExpLiterals: true,
    //   ignoreStrings: true,
    //   ignoreTemplateLiterals: true
    // } ],

    // limits the number of parameters that can be used in the function declaration.
    // 'max-params': [ 'off', 3 ],

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

    // enforce "same line" or "multiple line" on object properties.
    // https://eslint.org/docs/rules/object-property-newline
    // 'object-property-newline': [ 'error', {
    //   allowAllPropertiesOnSameLine: true,
    // } ],

    // Requires operator at the beginning of the line in multiline statements
    // https://eslint.org/docs/rules/operator-linebreak
    // 'operator-linebreak': [ 'error', 'after', { overrides: { '=': 'none' } } ],

    // do not require jsdoc
    // https://eslint.org/docs/rules/require-jsdoc
    // 'require-jsdoc': 'off'

    // require or disallow a space immediately following the // or /* in a comment
    // https://eslint.org/docs/rules/spaced-comment
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

    /**************************************************************
     * Nit Picky rules, we would probably not move these to the primary .eslintrc.js file
     *******/

    // enforce newline at the end of file, with no multiple empty lines
    'eol-last': [ 'error', 'never' ],

    // enforces empty lines around comments
    // PhET devs do not want this to be so strict in general
    'lines-around-comment': [ 'error', { beforeLineComment: true } ]

    /********************************
     * End of the Nit Picky rules
     *******/
  }
};