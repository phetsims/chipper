// Copyright 2024-2025, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu

/**
 * Checks if the test value is compatible with the groundTruth value. This does so recursively on component values of state.
 * Compatability relies on treating one as the correct value, and determining if the other is compatible with it.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * @param groundTruthValue - The new value/schema to validate compatibility.
 * @param testValue - The original value to check against.
 * @returns `true` if compatible, `false` otherwise.
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { PhetioElementState } from '../../../tandem/js/phet-io-types.js';

function areCompatible( groundTruthValue: IntentionalAny, testValue: IntentionalAny ): boolean {
  // If groundTruthValue is an array, handle array compatibility with ordered elements
  if ( Array.isArray( groundTruthValue ) ) {
    if ( !Array.isArray( testValue ) ) {
      // Type mismatch: new expects an array, but old is not
      return false;
    }

    // The old array must have at least as many items as the new array
    // TODO: Hard code something for validValues for supporting sets? https://github.com/phetsims/phet-io/issues/1999
    //       key === 'validValues' -> treat as set
    if ( testValue.length !== groundTruthValue.length ) {
      return false;
    }

    // Iterate through each item in the new array by index
    for ( let i = 0; i < groundTruthValue.length; i++ ) {
      const newItem = groundTruthValue[ i ];
      const oldItem = testValue[ i ];

      // Check compatibility of the current indexed items
      if ( !areCompatible( newItem, oldItem ) ) {
        return false;
      }
    }

    // All new items are compatible with corresponding old items
    return true;
  }

  // If groundTruthValue is an object (but not an array), handle object compatibility
  if ( typeof groundTruthValue === 'object' && groundTruthValue !== null ) {
    if ( typeof testValue !== 'object' || testValue === null || Array.isArray( testValue ) ) {
      // Type mismatch: new expects an object, but old is not an object or is an array
      return false;
    }

    // Iterate through each key in the new object
    for ( const key in groundTruthValue ) {
      if ( groundTruthValue.hasOwnProperty( key ) ) {
        if ( !testValue.hasOwnProperty( key ) ) {
          // Key missing in old object
          return false;
        }

        // Recursively check compatibility for the nested key
        if ( !areCompatible( groundTruthValue[ key ], testValue[ key ] ) ) {
          return false;
        }
      }
    }

    // All keys in the new object are compatible
    return true;
  }

  // For primitive values, perform a strict equality check
  return testValue === groundTruthValue;
}

/**
 * Tests if the initialState as found in the PhET-iO API file is compatible with another. This implementation treats
 * the groundTruthState as the correct definition, and compares it to the test state to see if the testState is
 * "compatible". Compatible means that for every entry/value in the ground truth (recursively), there is that same
 * structure and value in the test state. Extra data in the testState is acceptable, but data missing from testState that
 * is in the groundTruthState is incompatible.
 *
 * Compatibility cheat sheet:
 *   Extra key in the testState that isn't in the groundTruthState: ---- compatible
 *   Extra element in an array in testState: --------------------------- compatible
 *   One less element in an array in testState: ------------------------ NOT compatible
 *   Both have the same key and the same numeric value: ---------------- compatible
 *   Both have the same key but different numeric value: --------------- NOT Compatible
 */
const isInitialStateCompatible = ( groundTruthState: PhetioElementState, testState: PhetioElementState ): boolean => {
  return areCompatible( groundTruthState, testState );
};
export default isInitialStateCompatible;