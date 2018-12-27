// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `qunit` at the *top-level* of chipper. May need `npm install -g qunit` beforehand, if it hasn't been run yet.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// const assert = require( 'assert' );
// const chai = require( 'chai' );
const execute = require( '../js/grunt/execute' );
const grunt = require( 'grunt' );
const qunit = require( 'qunit' );

const gruntCommand = /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt';

qunit.module( 'Chains building' );

function assertFileExistence( assert, filename ) {
  assert.ok( grunt.file.exists( filename ), filename );
}

function assertChainsExistence( assert, brand, options ) {
  const {
    allHTML = false,
    debugHTML = false,
    locales = [ 'en' ]
  } = options || {};

  if ( brand === 'phet' ) {
    if ( locales.includes( 'en' ) ) {
      assertFileExistence( assert, '../chains/build/phet/chains_en_iframe_phet.html' );
    }
    for ( const locale of locales ) {
      assertFileExistence( assert, `../chains/build/phet/chains_${locale}_phet.html` );
    }
    assertFileExistence( assert, '../chains/build/phet/chains-128.png' );
    assertFileExistence( assert, '../chains/build/phet/chains-600.png' );
    assertFileExistence( assert, '../chains/build/phet/chains-twitter-card.png' );
    assertFileExistence( assert, '../chains/build/phet/dependencies.json' );
    allHTML && assertFileExistence( assert, '../chains/build/phet/chains_all_phet.html' );
    debugHTML && assertFileExistence( assert, '../chains/build/phet/chains_all_phet_debug.html' );
  }

  if ( brand === 'phet-io' ) {
    assertFileExistence( assert, '../chains/build/phet-io/chains_all_phet-io.html' );
    assertFileExistence( assert, '../chains/build/phet-io/chains-128.png' );
    assertFileExistence( assert, '../chains/build/phet-io/chains-600.png' );
    assertFileExistence( assert, '../chains/build/phet-io/contrib' );
    assertFileExistence( assert, '../chains/build/phet-io/doc' );
    assertFileExistence( assert, '../chains/build/phet-io/lib' );
    assertFileExistence( assert, '../chains/build/phet-io/wrappers' );
    assertFileExistence( assert, '../chains/build/phet-io/dependencies.json' );
    assertFileExistence( assert, '../chains/build/phet-io/chains_all_phet-io_debug.html' ); // phet-io brand should always have debug html.
  }
}

qunit.test( 'Build (no args)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', {} );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (with added HTMLs)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--allHTML', '--debugHTML' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', { allHTML: true, debugHTML: true } );
  assertChainsExistence( assert, 'phet-io', { allHTML: true, debugHTML: true } );
} );

qunit.test( 'Build (no uglification)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--uglify=false' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', {} );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (no mangling)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--mangle=false' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', {} );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (instrument)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--instrument', '--uglify=false' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', {} );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (all locales)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=*' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', { locales: [ 'en', 'ar', 'es', 'zh_CN' ] } );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (es,zh_CN locales)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=es,zh_CN' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', { locales: [ 'es', 'zh_CN' ] } );
  assertChainsExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (phet brand only)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet', {} );
} );

qunit.test( 'Build (phet-io brand only)', async ( assert ) => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet-io' ], { cwd: '../chains' } );
  assertChainsExistence( assert, 'phet-io', {} );
} );
