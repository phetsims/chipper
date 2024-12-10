// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import browserEslintConfig from '../../../perennial-alias/js/eslint/config/browser.eslint.config.mjs';
import { mutateForNestedConfig } from '../../../perennial-alias/js/eslint/config/root.eslint.config.mjs';


export default [
  ...mutateForNestedConfig( browserEslintConfig ),
  {
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  }
];