// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `qunit` at the top-level of chipper. May need `npm install -g qunit` beforehand, if it hasn't been run yet.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import execute from '../../perennial-alias/js/common/execute.js';
import gruntCommand from '../../perennial-alias/js/common/gruntCommand.js';
import qunit from '../../perennial-alias/js/npm-dependencies/qunit.js';

qunit.module( 'Bumper generation', {
  afterEach: async () => {
    // Hard reset to undo what we just did
    await execute( 'git', [ 'reset', '--hard' ], '../bumper' );
    await execute( 'git', [ 'clean', '-f' ], '../bumper' );
  }
} );

qunit.test( 'Development HTML', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-development-html' ], '../bumper' );
  assert.expect( 0 );
} );

qunit.test( 'Test HTML', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-test-html' ], '../bumper' );
  assert.expect( 0 );
} );

qunit.test( 'A11Y View HTML', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-a11y-view-html' ], '../bumper' );
  assert.expect( 0 );
} );

qunit.test( 'Published README', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'published-readme' ], '../bumper' );
  assert.expect( 0 );
} );

qunit.test( 'Unpublished README', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'unpublished-readme' ], '../bumper' );
  assert.expect( 0 );
} );

qunit.test( 'Copyright', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'update-copyright-dates' ], '../bumper' );
  assert.expect( 0 );
} );