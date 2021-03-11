// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

'use strict';

/**
 * Eslint config applied only to sims that are completely written in es6, with no es5 code.
 */
module.exports = {
  extends: './sim_eslintrc.js',

  // The rules are organized like they are in the list at https://eslint.org/docs/rules/
  // First by type, then alphabetically within type
  // Explicitly list all rules so it is easy to see what's here and to keep organized
  rules: {

    // require braces around arrow function bodies
    'arrow-body-style': 'off', // OK to have braces or not braces

    // require parentheses around arrow function arguments
    'arrow-parens': 'error',

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
    'object-shorthand': 'off', // TODO: 448 fails, https://github.com/phetsims/chipper/issues/814 We determined this is difficult to refactor and maintain, find a way to disallow

    // require using arrow functions for callbacks
    'prefer-arrow-callback': 'off', // TODO: 9 fails, https://github.com/phetsims/chipper/issues/814 enable this rule

    // require `const` declarations for variables that are never reassigned after declared
    'prefer-const': 'error',

    // require destructuring from arrays and/or objects
    'prefer-destructuring': 'off', // const {CURVE_X_RANGE} = CalculusGrapherConstants; seems worse than const CURVE_X_RANGE = CalculusGrapherConstants.CURVE_X_RANGE;

    // disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
    'prefer-numeric-literals': 'error',

    // require rest parameters instead of `arguments`
    'prefer-rest-params': 'off', // TODO: 2 fails, https://github.com/phetsims/chipper/issues/814 we have 2 fails and we should fix them

    // require spread operators instead of `.apply()`
    'prefer-spread': 'error',

    // require template literals instead of string concatenation
    'prefer-template': 'off', // TODO: 99 fails, https://github.com/phetsims/chipper/issues/814 we have 99 fails, but we should fix them

    // require generator functions to contain `yield`
    'require-yield': 'error',

    // enforce spacing between rest and spread operators and their expressions
    'rest-spread-spacing': 'error',

    // enforce sorted import declarations within modules
    'sort-imports': 'off', // TODO https://github.com/phetsims/chipper/issues/814 would be nice to turn this rule on, if we can match it to WebStorm sorting rules

    // require symbol descriptions
    'symbol-description': 'error',

    // require or disallow spacing around embedded expressions of template strings
    'template-curly-spacing': 'error',

    // require or disallow spacing around the `*` in `yield*` expressions
    'yield-star-spacing': 'error'

  }
};