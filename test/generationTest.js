// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `qunit` at the top-level of chipper. May need `npm install -g qunit` beforehand, if it hasn't been run yet.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// const chai = require( 'chai' );
const execute = require( '../js/grunt/execute' );
const gruntCommand = /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt';
const qunit = require( 'qunit' );

qunit.module( 'Generation', {
  afterEach: async () => {
    // Hard reset to undo what we just did
    await execute( 'git', [ 'reset', '--hard' ], { cwd: '../chains' } );
    await execute( 'git', [ 'clean', '-f' ], { cwd: '../chains' } );
  }
} );

qunit.test( 'Development HTML', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-development-html' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Test HTML', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-test-html' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Colors HTML', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-development-colors-html' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'A11Y View HTML', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-a11y-view-html' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Config', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-config' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Test Config', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'generate-test-config' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Published README', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'published-README' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Unpublished README', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'unpublished-README' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );

qunit.test( 'Copyright', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ 'update-copyright-dates' ], { cwd: '../chains' } );
  assert.expect( 0 );
} );
