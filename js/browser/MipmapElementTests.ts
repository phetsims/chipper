// Copyright 2024, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import MipmapElement from './MipmapElement.js';

QUnit.module( 'MipmapElement' );

QUnit.test( 'mipmap', assert => {
  ( () => new MipmapElement( 10, 10, '', false ) )();
  assert.ok( true, 'mipmap created' );
} );