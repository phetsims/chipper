// Copyright 2017-2026, University of Colorado Boulder

/**
 * Unit tests, run with `qunit` at the top-level of chipper. May need `npm install -g qunit` beforehand, if it hasn't been run yet.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import execute from '../../../perennial-alias/js/common/execute.js';
import gruntCommand from '../../../perennial-alias/js/common/gruntCommand.js';
import qunit from '../../../perennial-alias/js/npm-dependencies/qunit.js';

qunit.module( 'Generation', {
  afterEach: async () => {
    // Hard reset to undo what we just did
    await execute( 'git', [ 'reset', '--hard' ], '../chains' );
    await execute( 'git', [ 'clean', '-f' ], '../chains' );
  }
} );

qunit.test( 'Development HTML', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-development-html' ], '../chains' );
  assert.expect( 0 );
} );

qunit.test( 'Test HTML', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-test-html' ], '../chains' );
  assert.expect( 0 );
} );

qunit.test( 'Published README', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'published-readme' ], '../chains' );
  assert.expect( 0 );
} );

qunit.test( 'Unpublished README', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'unpublished-readme' ], '../chains' );
  assert.expect( 0 );
} );

qunit.test( 'Copyright', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'update-copyright-dates' ], '../chains' );
  assert.expect( 0 );
} );