// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import { getBrowserConfiguration } from './browser.eslint.config.mjs';
import rootEslintConfig from './root.eslint.config.mjs';

/**
 * Eslint config applied only to sims.
 */
export default [
  ...rootEslintConfig,
  ...getBrowserConfiguration(),
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