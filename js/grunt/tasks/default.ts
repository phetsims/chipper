// Copyright 2024, University of Colorado Boulder

/**
 * Default command which runs lint-all, report-media, clean, and build.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import testGruntOptions from '../../../../perennial-alias/js/grunt/tasks/util/testGruntOptions.js';

( async () => {
  if ( getOption( 'test-options' ) ) {
    testGruntOptions();
    process.exit( 0 );
  }

  if ( getOption( 'lint' ) !== false ) {
    console.log( '\nRunning "lint-all"' );
    await ( await import( './lint-all.js' ) ).lintAllPromise;
  }

  if ( getOption( 'report-media' ) !== false ) {
    console.log( '\nRunning "report-media"' );
    await ( await import( './report-media.js' ) ).reportMediaPromise;
  }

  console.log( '\nRunning "clean"' );
  await ( await import( './clean.js' ) ).cleanPromise;

  console.log( '\nRunning "build"' );
  await ( await import( './build.js' ) ).buildPromise;
} )();