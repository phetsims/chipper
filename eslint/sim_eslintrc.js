// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

/* eslint-env node */
'use strict';

/**
 * Eslint config applied only to sims that are completely written in es6, with no es5 code.
 */
module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'bad-sim-text': 0 // commented out until lint errors are fixed, see https://github.com/phetsims/chipper/issues/728
  }
};