// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests, run with `qunit` at the *top-level* of chipper. May need `npm install -g qunit` beforehand, if it hasn't been run yet.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import execute from '../../perennial-alias/js/common/execute.js';
import gruntCommand from '../../perennial-alias/js/common/gruntCommand.js';
import grunt from '../../perennial-alias/js/npm-dependencies/grunt.js';
import qunit from '../../perennial-alias/js/npm-dependencies/qunit.js';

qunit.module( 'Bumper building' );

function assertFileExistence( assert, filename ) {
  assert.ok( grunt.file.exists( filename ), filename );
}

function assertBumperExistence( assert, brand, options ) {
  const {
    allHTML = false,
    debugHTML = false,
    locales = [ 'en' ]
  } = options || {};

  if ( brand === 'phet' ) {
    if ( locales.includes( 'en' ) ) {
      assertFileExistence( assert, '../bumper/build/phet/bumper_en_iframe_phet.html' );
    }
    for ( const locale of locales ) {
      assertFileExistence( assert, `../bumper/build/phet/bumper_${locale}_phet.html` );
    }
    assertFileExistence( assert, '../bumper/build/phet/bumper-128.png' );
    assertFileExistence( assert, '../bumper/build/phet/bumper-600.png' );
    assertFileExistence( assert, '../bumper/build/phet/bumper-twitter-card.png' );
    assertFileExistence( assert, '../bumper/build/phet/dependencies.json' );
    allHTML && assertFileExistence( assert, '../bumper/build/phet/bumper_all_phet.html' );
    debugHTML && assertFileExistence( assert, '../bumper/build/phet/bumper_all_phet_debug.html' );
  }

  if ( brand === 'phet-io' ) {
    assertFileExistence( assert, '../bumper/build/phet-io/bumper_all_phet-io.html' );
    assertFileExistence( assert, '../bumper/build/phet-io/bumper-128.png' );
    assertFileExistence( assert, '../bumper/build/phet-io/bumper-600.png' );
    assertFileExistence( assert, '../bumper/build/phet-io/contrib' );
    assertFileExistence( assert, '../bumper/build/phet-io/doc' );
    assertFileExistence( assert, '../bumper/build/phet-io/lib' );
    assertFileExistence( assert, '../bumper/build/phet-io/wrappers' );
    assertFileExistence( assert, '../bumper/build/phet-io/dependencies.json' );
    assertFileExistence( assert, '../bumper/build/phet-io/bumper_all_phet-io_debug.html' ); // phet-io brand should always have debug html.
  }
}

qunit.test( 'Build (no args)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io' ], '../bumper' );
  assertBumperExistence( assert, 'phet', {} );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (with added HTMLs)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--debugHTML' ], '../bumper' );
  assertBumperExistence( assert, 'phet', { allHTML: true, debugHTML: true } );
  assertBumperExistence( assert, 'phet-io', { allHTML: true, debugHTML: true } );
} );

qunit.test( 'Build (no uglification)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--uglify=false' ], '../bumper' );
  assertBumperExistence( assert, 'phet', {} );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (no mangling)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--mangle=false' ], '../bumper' );
  assertBumperExistence( assert, 'phet', {} );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (instrument)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--instrument', '--uglify=false' ], '../bumper' );
  assertBumperExistence( assert, 'phet', {} );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (all locales)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=*' ], '../bumper' );
  assertBumperExistence( assert, 'phet', { locales: [ 'en', 'ar', 'es', 'zh_CN' ] } );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (es,zh_CN locales)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet,phet-io', '--locales=es,zh_CN' ], '../bumper' );
  assertBumperExistence( assert, 'phet', { locales: [ 'es', 'zh_CN' ] } );
  assertBumperExistence( assert, 'phet-io', {} );
} );

qunit.test( 'Build (phet brand only)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet' ], '../bumper' );
  assertBumperExistence( assert, 'phet', {} );
} );

qunit.test( 'Build (phet-io brand only)', async assert => {
  assert.timeout( 120000 );
  await execute( gruntCommand, [ '--brands=phet-io' ], '../bumper' );
  assertBumperExistence( assert, 'phet-io', {} );
} );