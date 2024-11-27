// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import nodeEslintConfig from '../perennial-alias/js/eslint/config/node.eslint.config.mjs';

export default [
  ...nodeEslintConfig,
  {
    rules: {
      'phet/bad-chipper-text': 'error',
      '@typescript-eslint/no-explicit-any': 'off' // TODO: if we could use IntentionalAny, see https://github.com/phetsims/chipper/issues/1465
    }
  }
];