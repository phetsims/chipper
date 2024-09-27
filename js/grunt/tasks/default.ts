// Copyright 2024, University of Colorado Boulder

/**
 * Default command which runs lint-all, report-media, clean, and build.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getOption from './util/getOption';

( async () => {
  if ( getOption( 'lint' ) !== false ) {
    await ( await import( './lint-all.ts' ) ).lintAll;
  }

  if ( getOption( 'report-media' ) !== false ) {
    await ( await import( './report-media.ts' ) ).reportMedia;
  }

  await ( await import( './clean.ts' ) ).clean;

  await ( await import( './build.ts' ) ).build;
} )();