// Copyright 2024, University of Colorado Boulder

/**
 * Default command which runs lint-all, report-media, clean, and build.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import testGruntOptions from '../../../../perennial-alias/js/grunt/tasks/util/testGruntOptions';

( async () => {
  if ( getOption( 'test-options' ) ) {
    testGruntOptions();
    process.exit( 0 );
  }

  if ( getOption( 'lint' ) !== false ) {
    await ( await import( './lint-all.js' ) ).lintAll;
  }

  if ( getOption( 'report-media' ) !== false ) {
    await ( await import( './report-media.js' ) ).reportMedia;
  }

  await ( await import( './clean.js' ) ).clean;

  await ( await import( './build.js' ) ).build;
} )();