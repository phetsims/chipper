// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import browserEslintConfig from '../../../perennial-alias/js/eslint/config/browser.eslint.config.mjs';


export default [
  ...browserEslintConfig,
  {
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  }
];