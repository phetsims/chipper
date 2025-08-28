// Copyright 2025, University of Colorado Boulder

/**
 * A Fluent message that updates with the FluentBundle.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import { TReadOnlyProperty, isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import affirm from '../../../perennial-alias/js/browser-and-node/affirm.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { FluentBundle } from '../browser-and-node/FluentLibrary.js';
import chipper from './chipper.js';
import FluentUtils from './FluentUtils.js';

export default function createFluentMessageProperty(
  bundleProperty: TReadOnlyProperty<FluentBundle>,
  messageKey: string,
  values: IntentionalAny = {} ): TReadOnlyProperty<string> {

  const dependencies: TReadOnlyProperty<IntentionalAny>[] = [ bundleProperty ];
  const keys = Object.keys( values );
  keys.forEach( key => {
    if ( isTReadOnlyProperty( values[ key ] ) ) {
      dependencies.push( values[ key ] );
    }
  } );

  // @ts-expect-error This is a prototype so I am not going to worry about this complicated TS for now.
  return new DerivedProperty( dependencies, ( bundle: FluentBundle, ...unusedValues ) => {
    const message = bundle.getMessage( messageKey );

    affirm( message, 'A message is required to format.' );
    affirm( message.value, 'A message value is required to format.' );

    return FluentUtils.formatMessageWithBundle( message.value, bundle, values );
  } );
}

chipper.register( 'createFluentMessageProperty', createFluentMessageProperty );