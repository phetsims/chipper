// Copyright 2024, University of Colorado Boulder

/**
 * Eslint config applied only to browser-based runtimes.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import globals from 'globals';
import rootEslintConfig from './root.eslint.config.mjs';

export const browserGlobals = {
  languageOptions: {
    globals: {
      ...globals.browser
    }
  }
};

export default [
  ...rootEslintConfig,
  browserGlobals
];