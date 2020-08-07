// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

'use strict';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'no-var': 2,
    'no-template-curly-in-string': 2
  },
  env: {

    // specify appropriate environment vars for node code
    browser: false,
    node: true
  }
};