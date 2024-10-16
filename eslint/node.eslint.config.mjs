// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import getNodeConfiguration from './getNodeConfiguration.mjs';
import rootEslintConfig from './root.eslint.config.mjs';

/**
 * The config file to use for node-based code.
 * NOTE: No code should be added here!! Instead, add new configuration to `getNodeConfiguration` for reuse.
 * @author Michael Kauzmann (PhET Interactive Simulations
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default [
  ...rootEslintConfig,
  ...getNodeConfiguration()
];