// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import rootEslintConfig, { browserGlobals } from './root.eslint.config.mjs';

/**
 * Eslint config applied only to sims.
 */
export default [
  ...rootEslintConfig,
  browserGlobals,
  {
    rules: {
      'phet/bad-sim-text': 'error'
    }
  },
  {
    // Most html files don't need to behave like sims
    files: [ '*.html' ],
    rules: {
      'phet/bad-sim-text': 'off'
    }
  }
];