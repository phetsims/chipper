// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `mocha`
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const assert = require( 'assert' );
// const chai = require( 'chai' );
const execute = require( '../js/grunt/execute' );
const grunt = require( 'grunt' );

const gruntCommand = /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt';

function assertFileExistence( filename ) {
  assert( grunt.file.exists( filename ), filename );
}

function assertChainsExistence( brand, options ) {
  const {
    allHTML = false,
    debugHTML = false,
    locales = [ 'en' ],
    oneOff = null
  } = options || {};

  const oneOffSuffix = oneOff ? `_${oneOff}` : '';

  if ( brand === 'phet' ) {
    if ( locales.includes( 'en' ) ) {
      assertFileExistence( '../chains/build/phet/chains_en_iframe.html' );
    }
    for ( let locale of locales ) {
      assertFileExistence( `../chains/build/phet/chains_${locale}_phet${oneOffSuffix}.html` );
    }
    assertFileExistence( '../chains/build/phet/chains-128.png' );
    assertFileExistence( '../chains/build/phet/chains-600.png' );
    assertFileExistence( '../chains/build/phet/chains-twitter-card.png' );
    assertFileExistence( '../chains/build/phet/dependencies.json' );
    allHTML && assertFileExistence( `../chains/build/phet/chains_all_phet${oneOffSuffix}.html` );
    debugHTML && assertFileExistence( `../chains/build/phet/chains_all_phet${oneOffSuffix}_debug.html` );
  }

  if ( brand === 'phet-io' ) {
    assertFileExistence( `../chains/build/phet-io/chains_all_phet-io${oneOffSuffix}.html` );
    assertFileExistence( '../chains/build/phet-io/chains-128.png' );
    assertFileExistence( '../chains/build/phet-io/chains-600.png' );
    assertFileExistence( '../chains/build/phet-io/contrib' );
    assertFileExistence( '../chains/build/phet-io/docs' );
    assertFileExistence( '../chains/build/phet-io/lib' );
    assertFileExistence( '../chains/build/phet-io/wrappers' );
    assertFileExistence( '../chains/build/phet-io/dependencies.json' );
    debugHTML && assertFileExistence( `../chains/build/phet-io/chains_all_phet-io${oneOffSuffix}_debug.html` );
  }
}

describe( 'hooks', function() {
  beforeEach( function() {
    // TODO
  } );
} );

describe( 'Chains building', () => {
  it( 'Build (no args)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io' ], '../chains' );
    assertChainsExistence( 'phet', {} );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (with added HTMLs)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--allHTML', '--debugHTML' ], '../chains' );
    assertChainsExistence( 'phet', { allHTML: true, debugHTML: true } );
    assertChainsExistence( 'phet-io', { allHTML: true, debugHTML: true } );
  } ).timeout( 120000 );

  it( 'Build (no uglification)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--uglify=false' ], '../chains' );
    assertChainsExistence( 'phet', {} );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (no mangling)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--mangle=false' ], '../chains' );
    assertChainsExistence( 'phet', {} );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (instrument)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--instrument', '--uglify=false' ], '../chains' );
    assertChainsExistence( 'phet', {} );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (all locales)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=*' ], '../chains' );
    assertChainsExistence( 'phet', { locales: [ 'en', 'ar', 'es', 'zh_CN' ] } );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (es,zh_CN locales)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=es,zh_CN' ], '../chains' );
    assertChainsExistence( 'phet', { locales: [ 'es', 'zh_CN' ] } );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (phet brand only)', async () => {
    await execute( gruntCommand, [ '--brands=phet' ], '../chains' );
    assertChainsExistence( 'phet', {} );
  } ).timeout( 120000 );

  it( 'Build (phet-io brand only)', async () => {
    await execute( gruntCommand, [ '--brands=phet-io' ], '../chains' );
    assertChainsExistence( 'phet-io', {} );
  } ).timeout( 120000 );

  it( 'Build (one-off)', async () => {
    await execute( gruntCommand, [ '--brands=phet,phet-io', '--oneOff=foobar' ], '../chains' );
    assertChainsExistence( 'phet', { oneOff: 'foobar' } );
    assertChainsExistence( 'phet-io', { oneOff: 'foobar' } );
  } ).timeout( 120000 );
} );
