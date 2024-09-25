// Copyright 2023, University of Colorado Boulder
// @author Michael Kauzmann


/**
 * Eslint config applied only to "library" code. This means code that is potentially meant to run outside of the context
 * of phetsims. For example, a SUN/Checkbox shouldn't require a hard dependency on the phetsim environment (for example
 * joist's nav bar or preferences) to correctly run.
 */
module.exports = {
  extends: './sim_eslintrc.js',
  rules: {
    'bad-phet-library-text': 'error'
  }
};