// Copyright 2013-2025, University of Colorado Boulder

/**
 * Duplication to support lint-project api, This branch predates the lint-project api change in https://github.com/phetsims/perennial/commit/062ccfb5d5bb8b71566a1ed7831417886e6dbe8a
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { lintAllPromise } from './lint-all.js';

( async () => {
  await lintAllPromise;
} )();