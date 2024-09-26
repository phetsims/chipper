// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import globals from 'globals';
import nodeEslintConfig from './node.eslint.config.mjs';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
export default [
  ...nodeEslintConfig,
  {

    languageOptions: {
      globals: {

        // TODO: we would like to say exclude browser, but we will have to remove it from root.eslint.config.mjs to do so. See https://github.com/phetsims/chipper/issues/1451
        // That is, we used to say browser: false. How to do that with flat?
        ...globals.node
      }
    },
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  }
];