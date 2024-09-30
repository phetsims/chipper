// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import globals from 'globals';
import rootEslintConfig from './root.eslint.config.mjs';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
export default [
  ...rootEslintConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,

        // Deno
        Deno: 'readonly'
      }
    },

    rules: {
      'bad-sim-text': 'off'
    }
  } ];