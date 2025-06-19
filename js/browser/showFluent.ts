// Copyright 2025, University of Colorado Boulder

/**
 * When a sim is run with ?showFluent, show a UI that displays translations, for evaluation purposes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import FluentConstant from './FluentConstant.js';
import FluentPattern from './FluentPattern.js';

export default function showFluent( simFluent: Record<string, IntentionalAny> ): void {

  // Recursively iterate over the MembraneTransportFluent object. For each key, console.log the key and its value.
  const logObject = (
    obj: IntentionalAny,
    prefix = '',
    seen: WeakSet<object> = new WeakSet()
  ): void => {
    // 1️⃣  Bail out on non-objects (primitives or null)
    if ( obj === null || typeof obj !== 'object' ) {
      return;
    }

    // 2️⃣  Skip objects we’ve seen before (breaks circular refs)
    if ( seen.has( obj ) ) {
      return;
    }
    seen.add( obj );

    for ( const key of Object.keys( obj ) ) {
      const value = obj[ key ];

      if ( value instanceof FluentConstant ) {
        console.log( `${prefix}${key}: ${value.value}` );
      }
      else if ( value instanceof FluentPattern ) {
        console.log( `${prefix}${key}: ${JSON.stringify( value.args )}` );
      }
      else {
        // Only recurse into *real* objects
        logObject( value, `${prefix}${key}.`, seen );
      }
    }
  };
  logObject( simFluent );

  console.log( 'hello' );

}