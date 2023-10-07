// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann


/**
 * Eslint config applied only to sims.
 */
module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'bad-sim-text': 'error'
  },
  overrides: [
    {
      // Most html files don't need to behave like sims
      files: [ '*.html' ],
      rules: {
        'bad-sim-text': 'off'
      }
    }
  ]
};