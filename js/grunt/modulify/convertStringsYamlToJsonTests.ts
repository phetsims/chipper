// Copyright 2026, University of Colorado Boulder

/**
 * Tests for convertStringsYamlToJson.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import qunit from '../../../../perennial-alias/js/npm-dependencies/qunit.js';
import { nestJSONStringValues } from './convertStringsYamlToJson.js';

qunit.module( 'convertStringsYamlToJson' );

qunit.test( 'nestJSONStringValues accepts normal strings and interior spaces', assert => {
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

qunit.test( 'nestJSONStringValues rejects leading whitespace', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: ' leading whitespace'
    }
  } ), /a\.b.*" leading whitespace"/ );
} );

qunit.test( 'nestJSONStringValues rejects trailing whitespace', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: 'trailing whitespace '
    }
  } ), /a\.b.*"trailing whitespace "/ );
} );

qunit.test( 'nestJSONStringValues reports full nested key path', assert => {
  assert.throws( () => nestJSONStringValues( {
    a: {
      b: {
        c: 'invalid '
      }
    }
  } ), /a\.b\.c/ );
} );
