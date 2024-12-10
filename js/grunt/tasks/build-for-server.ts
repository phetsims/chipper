// Copyright 2024, University of Colorado Boulder

/**
 * Alias for build, meant for use by build-server only.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

( async () => {
  await ( await import( './build.js' ) ).buildPromise;
} )();