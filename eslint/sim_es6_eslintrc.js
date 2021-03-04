// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

'use strict';

/**
 * Eslint config applied only to sims that are completely written in es6, with no es5 code.
 */
module.exports = {
  extends: './sim_eslintrc.js',
  rules: {
    'no-var': 'error',
    'no-template-curly-in-string': 'error'
  }
};