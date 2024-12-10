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
      'phet/bad-chipper-text': 'error'
    }
  },
  {
    // TODO: Use eslint/config/util/allowFloatingPromises instead, see https://github.com/phetsims/chipper/issues/1541
    files: [ 'js/scripts/**/*', 'js/grunt/tasks/**/*' ],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
];