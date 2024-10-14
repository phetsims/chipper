// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { getBrowserConfiguration } from './eslint/browser.eslint.config.mjs';
import { getNodeConfiguration } from './eslint/node.eslint.config.mjs';
import rootEslintConfig from './eslint/root.eslint.config.mjs';

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
      'phet/bad-chipper-text': 'error'
    }
  }
];