// Copyright 2015-2019, University of Colorado Boulder

/* eslint-env node */
'use strict';

/**
 * Stricter rules to support code reviews.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

  // Use all of the default rules from eslint, unless overridden below.
  extends: './sim_es6_eslintrc.js',

  // The new rules, overrides, etc.
  rules: {

    'no-use-before-define': [
      2
    ],
    // TODO: This may be good to have
    'new-cap': [
      2
    ],

    // disallow trailing whitespace at the end of lines (fixable)
    'no-trailing-spaces': 2,

    // USE THIS DURING CODE REVIEW
    // specify the maximum length of a line in your program
    'max-len': [
      2,
      // this many columns per line
      120,
      // tab counts for this many spaces
      4
    ]
  }
};