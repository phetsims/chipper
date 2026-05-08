// Copyright 2026, University of Colorado Boulder

/**
 * Tests for convertStringsYamlToJson.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { nestJSONStringValues } from './convertStringsYamlToJson.js';

QUnit.module( 'convertStringsYamlToJson' );

QUnit.test( 'nestJSONStringValues accepts normal strings and interior spaces', assert => {
  assert.deepEqual( nestJSONStringValues( {
    a: 'normal string',
    b: {
      c: 'interior spaces are fine'
    }
  } ), {
    a: { value: 'normal string' },
    b: {
      c: { value: 'interior spaces are fine' }
    }
  } );
} );

QUnit.test( 'nestJSONStringValues rejects leading whitespace', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: ' leading whitespace'
    }
  } ), /a\.b.*" leading whitespace"/ );
} );

QUnit.test( 'nestJSONStringValues rejects trailing whitespace', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: 'trailing whitespace '
    }
  } ), /a\.b.*"trailing whitespace "/ );
} );

QUnit.test( 'nestJSONStringValues reports full nested key path', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: {
        c: 'invalid '
      }
    }
  } ), /a\.b\.c/ );
} );
