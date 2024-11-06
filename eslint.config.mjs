// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { getBrowserConfiguration } from '../perennial-alias/js/eslint/config/browser.eslint.config.mjs';
import getNodeConfiguration from '../perennial-alias/js/eslint/config/util/getNodeConfiguration.mjs';
import rootEslintConfig from '../perennial-alias/js/eslint/config/root.eslint.config.mjs';

const browserFiles = [
  'js/*', // not recursive
  'js/sim-tests/**/*'
];

export default [
  ...rootEslintConfig,
  ...getBrowserConfiguration( { files: browserFiles } ),
  ...getNodeConfiguration( {
    files: [ '**/*' ],
    ignores: browserFiles
  } ),
  {
    rules: {
      'phet/bad-chipper-text': 'error',
      '@typescript-eslint/no-explicit-any': 'off' // TODO: if we could use IntentionalAny. . . . https://github.com/phetsims/perennial/issues/371
    }
  }
];