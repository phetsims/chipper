// Copyright 2024, University of Colorado Boulder

/**
 * The buildtools-specific eslint config applied only to "server-side" files that aren't run in sims.
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
export default [
  {
    rules: {

      // TODO: we only want to turn these off in node code, still run them in the browser, see https://github.com/phetsims/chipper/issues/1451
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // TODO: Use IntentionalAny, https://github.com/phetsims/chipper/issues/1465
      '@typescript-eslint/no-floating-promises': 'off',
      'phet/bad-sim-text': 'off'
    }
  }
];