// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

import globals from 'globals';

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims. Factored out from
 * node.eslint.config for reuse in the root config.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations
 * @author Sam Reid (PhET Interactive Simulations)
 */
const getNodeConfiguration = ( pattern = {} ) => {
  return [
    {
      languageOptions: {
        globals: {
          ...globals.node
        }
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'phet/no-import-from-grunt-tasks': 'error',
        'phet/grunt-task-kebab-case': 'error'
      },
      ...pattern
    }
  ];
};

export default getNodeConfiguration;