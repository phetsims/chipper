// Copyright 2018, University of Colorado Boulder
// @author Michael Kauzmann

/**
 * The node-specific eslint config applied only to "server-side" files that aren't run in sims.
 * @author Michael Kauzmann (PhET Interactive Simulations
 * @author Sam Reid (PhET Interactive Simulations)
 */

import globals from 'globals';
import rootEslintConfig from './root.eslint.config.mjs';

export const getNodeConfiguration = ( pattern = {} ) => {
  return [
    {
      languageOptions: {
        globals: {
          ...globals.node
        }
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      },
      ...pattern
    },
    {

      // For entry points like scripts and "grunt" tasks, we often end with a floating promise which is not a problem
      files: [
        '**/js/grunt/tasks/**/*',
        '**/js/scripts/**/*'
      ],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off'
      }
    }
  ];
};

export default [
  ...rootEslintConfig,
  ...getNodeConfiguration()
];