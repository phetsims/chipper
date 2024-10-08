// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import globals from 'globals';
import rootEslintConfig from './root.eslint.config.mjs';

export const nodeLanguageOptionsAndRules = {
  languageOptions: {
    globals: {
      ...globals.node,

      // Deno
      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      Deno: 'readonly'
    }
  },
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-var-requires': 'off'
  }
};

export const nodeNoFloatingPromises = {

  // For entry points like scripts and "grunt" tasks, we often end with a floating promise which is not a problem
  files: [
    '**/js/grunt/tasks/**/*',
    '**/js/scripts/**/*'
  ],
  rules: {
    '@typescript-eslint/no-floating-promises': 'off'
  }
};

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
export default [
  ...rootEslintConfig,
  nodeLanguageOptionsAndRules,
  nodeNoFloatingPromises
];