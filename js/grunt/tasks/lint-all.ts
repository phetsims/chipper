// Copyright 2013-2025, University of Colorado Boulder

/**
 * Lints this repo and all of its dependencies.
 *
 * @deprecated, see lint-project
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
( async () => {

  console.warn( 'lint-all is deprecated, please use "lint-project"' );
  await ( await import( './lint-project.js' ) ).lintProjectPromise;
} )();