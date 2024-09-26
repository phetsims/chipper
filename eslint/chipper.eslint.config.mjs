// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import nodeEslintConfig from './node.eslint.config.mjs';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 */
export default [
  ...nodeEslintConfig,
  {
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  }
];