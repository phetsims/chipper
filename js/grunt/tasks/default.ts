// Copyright 2024, University of Colorado Boulder

/**
 * Default command which runs lint-all, report-media, clean, and build
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
// eslint-disable-next-line default-import-match-filename
import lintAll from './lint-all';
import reportMedia from '../reportMedia';
import getRepo from './util/getRepo.js';
import clean from './clean';
import build from './build';

const repo = getRepo();

( async () => {
  if ( grunt.option( 'lint' ) === false ) {
    // do nothing
  }
  else {
    await lintAll();
  }

  if ( grunt.option( 'report-media' ) === false ) {
    // do nothing
  }
  else {
    await reportMedia( repo );
  }

  await clean();
  await build();
} )();