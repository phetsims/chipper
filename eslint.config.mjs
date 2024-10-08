// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// TODO: This file needs help, see https://github.com/phetsims/chipper/issues/1451

import { browserGlobals } from './eslint/browser.eslint.config.mjs';
import { nodeLanguageOptionsAndRules, nodeNoFloatingPromises } from './eslint/node.eslint.config.mjs';
import rootEslintConfig from './eslint/root.eslint.config.mjs';

const browserFiles = [
  'js/*', // not recursive
  'js/sim-tests/**/*'
];

export default [
  ...rootEslintConfig,
  {
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  },
  {
    files: browserFiles,
    ...browserGlobals
  },
  {
    files: [
      '**/*'
    ],
    ignores: browserFiles,
    ...nodeLanguageOptionsAndRules
  },
  nodeNoFloatingPromises

  // TODO: See https://github.com/phetsims/chipper/issues/1451
  //   // 'parserOptions': {
  //   //   'sourceType': 'module',
  //   //   'allowImportExportEverywhere': true,
  //   //   'requireConfigFile': false
  //   // }
  // },
];