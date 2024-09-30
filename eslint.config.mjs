// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// TODO: This file needs help, see https://github.com/phetsims/chipper/issues/1451

import buildtoolsEslintConfig from './eslint/buildtools.eslint.config.mjs';
import chipperEslintConfig from './eslint/chipper.eslint.config.mjs';
import { browserGlobals } from './eslint/root.eslint.config.mjs';

// const combine = ( parentArray, files ) => {
//   const results = parentArray.map( parent => {
//     return {
//       ...parent,
//       files: files
//     };
//   } );
// };

// TODO: https://github.com/phetsims/chipper/issues/1451
export default [
  ...chipperEslintConfig,
  {
    files: [
      'js/*', // not recursive
      'js/sim-tests/**/*'
    ],
    ...browserGlobals
  },
  // {
  //   ignores: [ 'js/**/*' ]
  // },
  // {
  //   ignores: [
  //     '!js/grunt/**/*',
  //     '!js/common/**/*',
  //     '!js/phet-io/**/*',
  //     '!js/scripts/**/*',
  //     '!test/**/*'
  //   ]
  // },
  ...buildtoolsEslintConfig,
  {
    rules: {
      'phet/bad-chipper-text': 'error'
    }
  }
  // {
  //
  //   languageOptions: {
  //     globals: {
  //       ...globals.node
  //     }
  //   },
  //   rules: {
  //     'phet/bad-chipper-text': 'error',
  //     'phet/bad-sim-text': 'off'
  //   }
  //   // 'parserOptions': {
  //   //   'sourceType': 'module',
  //   //   'allowImportExportEverywhere': true,
  //   //   'requireConfigFile': false
  //   // }
  // },
  //
  // // https://eslint.org/docs/latest/use/configure/combine-configs#apply-a-config-array-to-a-subset-of-files
  // ...chipperEslintConfig.map( config => ( {
  //   ...config,
  //   ignores: [
  //     '**/*',
  //     '!./js/grunt/**/*',
  //     '!./js/common/**/*',
  //     '!./js/phet-io/**/*',
  //     '!./js/scripts/**/*',
  //     '!./test/**/*'
  //   ]
  // } ) ),
  //
  // {
  //   files: [
  //     './js/grunt/**/*',
  //     './js/common/**/*',
  //     './js/phet-io/**/*',
  //     './js/scripts/**/*',
  //     './test/**/*'
  //   ],
  //   rules: {
  //     '@typescript-eslint/no-require-imports': 'off',
  //     '@typescript-eslint/no-var-requires': 'off',
  //     '@typescript-eslint/no-floating-promises': 'off'
  //   }
  // }
  // {
  //   'files': [
  //     './js/sim-tests/**/*',
  //     './test/**/*'
  //   ],
  //   'extends': './eslint/sim.eslint.config.mjs'
  // }
];