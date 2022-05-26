// Copyright 2022, University of Colorado Boulder
// @author Jesse Greenberg

/**
 * Eslint config that enables rules that require project information, just for typescript files. This
 * slows down eslint significantly. These are enabled conditionally with option `--type-info` when
 * running `grunt lint`. See chipper's Gruntfile  and lint.js for more information.
 */
module.exports = {
  overrides: [
    {
      files: [
        '**/*.ts'
      ],

      // parserOptions.project is required for these rules, that is set in lint.js so that we point
      // to the correct tsconfig.json.
      rules: {
        // '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        // '@typescript-eslint/no-unsafe-member-access': 'error'
        // '@typescript-eslint/restrict-plus-operands':'error',
        // '@typescript-eslint/prefer-readonly': 'error' // readonly when possible

        // // Recommended needing type info:
        // '@typescript-eslint/await-thenable': 'error',
        // '@typescript-eslint/no-floating-promises': 'error',
        // '@typescript-eslint/no-for-in-array': 'error',
        // '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error'
        // '@typescript-eslint/no-unsafe-argument': 'error',
        // '@typescript-eslint/no-unsafe-assignment': 'error',
        // '@typescript-eslint/no-unsafe-call': 'error',
        // '@typescript-eslint/no-unsafe-member-access': 'error',
        // '@typescript-eslint/no-unsafe-return': 'error',
        // '@typescript-eslint/restrict-plus-operands': 'error',
        // '@typescript-eslint/restrict-template-expressions': 'error',
        // '@typescript-eslint/unbound-method': 'error',

        // // Overriding rules that exist in javascript:
        // '@typescript-eslint/no-implied-eval': 'error',
        // '@typescript-eslint/require-await': 'error',
      }
    }
  ]
};