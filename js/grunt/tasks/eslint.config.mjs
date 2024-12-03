// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for grunt tasks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { mutateForNestedConfig } from '../../../../perennial-alias/js/eslint/config/root.eslint.config.mjs';
import allowFloatingPromises from '../../../../perennial-alias/js/eslint/config/util/allowFloatingPromises.mjs';
import eslintConfig from '../../../eslint.config.mjs';

export default [
  ...mutateForNestedConfig( eslintConfig ),
  ...allowFloatingPromises
];