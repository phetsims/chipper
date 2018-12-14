// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

/* eslint-env node */
'use strict';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims. See perennial/data/node
 * for list.
 *
 * The general pattern to support node is to add a `.eslintrc` file in a node dir that "extends" this file, for example
 * see `chipper/js/grunt/.eslintrc`.
 */
module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'no-restricted-syntax': [ 'off', 'ForOfStatement' ]
  }
};