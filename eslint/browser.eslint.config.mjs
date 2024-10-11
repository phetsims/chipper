// Copyright 2024, University of Colorado Boulder

/**
 * Eslint config applied only to browser-based runtimes.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import globals from 'globals';
import rootEslintConfig from './root.eslint.config.mjs';

export const getBrowserConfiguration = ( pattern = {} ) => {
  return [

    // Where getBrowserConfiguration is included elsewhere, the call site must supply the rootEslintConfig.
    {
      languageOptions: {
        globals: {
          ...globals.browser
        }
      },
      ...pattern
    } ];
};

export default [

  // Here, we must have a complete set of rules for interpretation, so we include the rootEslintConfig.
  ...rootEslintConfig,
  ...getBrowserConfiguration()
];