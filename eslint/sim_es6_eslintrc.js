// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

/* eslint-env node */
'use strict';

/**
 * Eslint config applied only to sims that are completely written in es6, with no es5 code.
 */
module.exports = {
  extends: './sim_eslintrc.js',
  rules: {
    'no-var': 2,
    'no-template-curly-in-string': 2
  }
};