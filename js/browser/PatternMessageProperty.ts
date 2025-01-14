// Copyright 2024, University of Colorado Boulder

/**
 * A Property whose value is a message from a bundle with arguments. Each argument can be a Property,
 * and the message will be updated either the message or the argument changes.
 *
 * A similar idea as PatternStringProperty, but for Fluent messages.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { DerivedProperty1 } from '../../../axon/js/DerivedProperty.js';
import TReadOnlyProperty, { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import chipper from './chipper.js';
import FluentUtils from './FluentUtils.js';
import LocalizedMessageProperty from './LocalizedMessageProperty.js';

export default class PatternMessageProperty extends DerivedProperty1<string, string> {
  public constructor( messageProperty: LocalizedMessageProperty, values: IntentionalAny ) {
    const dependencies: TReadOnlyProperty<IntentionalAny>[] = [ messageProperty ];
    const keys = Object.keys( values );
    keys.forEach( key => {
      if ( isTReadOnlyProperty( values[ key ] ) ) {
        dependencies.push( values[ key ] );
      }
    } );

    // @ts-expect-error This is a prototype so I am not going to worry about this complicated TS for now.
    super( dependencies, ( message, ...unusedArgs ) => {

      const args = FluentUtils.handleFluentArgs( values );

      // Format the message with the arguments to resolve a string.
      return messageProperty.bundleProperty.value.format( message, args );
    } );
  }
}

chipper.register( 'PatternMessageProperty', PatternMessageProperty );