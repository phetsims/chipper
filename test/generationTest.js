// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `mocha`
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// const chai = require( 'chai' );
const execute = require( '../js/grunt/execute' );

const gruntCommand = /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt';

describe( 'hooks', function() {
  afterEach( async () => {
    // Hard reset to undo what we just did
    await execute( 'git', [ 'reset', '--hard' ], '../chains' );
  } );
} );

describe( 'Generation', () => {
  it( 'Development HTML', async () => {
    await execute( gruntCommand, [ 'generate-development-html' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Test HTML', async () => {
    await execute( gruntCommand, [ 'generate-test-html' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Colors HTML', async () => {
    await execute( gruntCommand, [ 'generate-development-colors-html' ], '../chains' );
  } ).timeout( 120000 );

  it( 'A11Y View HTML', async () => {
    await execute( gruntCommand, [ 'generate-a11y-view-html' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Config', async () => {
    await execute( gruntCommand, [ 'generate-config' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Test Config', async () => {
    await execute( gruntCommand, [ 'generate-test-config' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Published README', async () => {
    await execute( gruntCommand, [ 'published-README' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Unpublished README', async () => {
    await execute( gruntCommand, [ 'unpublished-README' ], '../chains' );
  } ).timeout( 120000 );

  it( 'Copyright', async () => {
    await execute( gruntCommand, [ 'update-copyright-dates' ], '../chains' );
  } ).timeout( 120000 );
} );
