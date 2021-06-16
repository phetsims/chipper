[object Promise]

/**
 * Tests for ChipperStringUtils
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env node*/
'use strict';

const ChipperStringUtils = require( './ChipperStringUtils' );
const qunit = require( 'qunit' );
qunit.module( 'ChipperStringUtils' );


qunit.test( 'forEachString', assert => {
  const map1 = {
    x: { value: 'x' },
    y: {
      value: 'y',
      z: { value: 'z' }
    },
    intermediary: {
      a: { value: 'a' },
      b: { value: 'b' },
      intermediary2: {
        c: { value: 'c' }
      }
    }
  };

  let count = 0;
  const expectedKeys = [
    'x',
    'y',
    'y.z',
    'intermediary.a',
    'intermediary.b',
    'intermediary.intermediary2.c'
  ];
  ChipperStringUtils.forEachString( map1, key => {
    count++;
    const keyIndex = expectedKeys.indexOf( key );
    assert.ok( keyIndex >= 0, `unexpected key:${key}` );
    expectedKeys.splice( keyIndex, 1 ); // just remove the single item
  } );
  assert.ok( expectedKeys.length === 0, 'all keys should be accounted for' );
  assert.ok( count === 6, 'should be three string' );
  assert.ok( true, 'success' );
} );
