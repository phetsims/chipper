// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

/* eslint-env node */
'use strict';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'no-restricted-syntax': [ 'off', 'ForOfStatement' ],
    'no-var': 2,
    'phet-object-shorthand': 2 // never allow properties only
  },
  env: {

    // specify appropriate environment vars for node code
    browser: false,
    node: true
  }
};