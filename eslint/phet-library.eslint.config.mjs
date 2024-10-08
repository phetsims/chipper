// Copyright 2023, University of Colorado Boulder
// @author Michael Kauzmann

import simEslintConfig from './sim.eslint.config.mjs';

/**
 * Eslint config applied only to "library" code. This means code that is potentially meant to run outside of the context
 * of phetsims. For example, a SUN/Checkbox shouldn't require a hard dependency on the phetsim environment (for example
 * joist's nav bar or preferences) to correctly run.
 */
export default [
  ...simEslintConfig,
  {
    rules: {
      'phet/bad-phet-library-text': 'error'
    }
  }
];