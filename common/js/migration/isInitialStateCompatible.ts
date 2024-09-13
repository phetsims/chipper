// Copyright 2024, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu

/**
 * TODO: Doc, https://github.com/phetsims/phet-io/issues/1951
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { PhetioElementState } from '../../../../tandem/js/TandemConstants.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

/**
 * Checks if the old value is compatible with the new value.
 * @param oldValue - The original value to check against.
 * @param newValue - The new value/schema to validate compatibility.
 * @returns `true` if compatible, `false` otherwise.
 */
function areCompatible( oldValue: IntentionalAny, newValue: IntentionalAny ): boolean {
  // If newValue is an array, handle array compatibility with ordered elements
  if ( Array.isArray( newValue ) ) {
    if ( !Array.isArray( oldValue ) ) {
      // Type mismatch: new expects an array, but old is not
      return false;
    }

    // The old array must have at least as many items as the new array
    if ( oldValue.length < newValue.length ) {
      return false;
    }

    // Iterate through each item in the new array by index
    for ( let i = 0; i < newValue.length; i++ ) {
      const newItem = newValue[ i ];
      const oldItem = oldValue[ i ];

      // Check compatibility of the current indexed items
      if ( !areCompatible( oldItem, newItem ) ) {
        return false;
      }
    }

    // All new items are compatible with corresponding old items
    return true;
  }

  // If newValue is an object (but not an array), handle object compatibility
  if ( typeof newValue === 'object' && newValue !== null ) {
    if ( typeof oldValue !== 'object' || oldValue === null || Array.isArray( oldValue ) ) {
      // Type mismatch: new expects an object, but old is not an object or is an array
      return false;
    }

    // Iterate through each key in the new object
    for ( const key in newValue ) {
      if ( newValue.hasOwnProperty( key ) ) {
        if ( !oldValue.hasOwnProperty( key ) ) {
          // Key missing in old object
          return false;
        }

        // Recursively check compatibility for the nested key
        if ( !areCompatible( oldValue[ key ], newValue[ key ] ) ) {
          return false;
        }
      }
    }

    // All keys in the new object are compatible
    return true;
  }

  // For primitive values, perform a strict equality check
  return oldValue === newValue;
}

const phetioStateOneWayEqualityTests = ( oldState: PhetioElementState, newState: PhetioElementState ): boolean => {
  return areCompatible( oldState, newState );
};
export default phetioStateOneWayEqualityTests;