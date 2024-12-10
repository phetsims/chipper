// Copyright 2021-2024, University of Colorado Boulder

/**
 * Format a PhET-iO API file for printing.
 *
 * NOTE: Please be mindful of the copy in copyWithSortedKeys, see https://github.com/phetsims/phet-io/issues/1733
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import fixEOL from '../../../perennial-alias/js/common/fixEOL.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

/**
 * Creates a new object, recursively, by sorting the keys at each level.
 * @param unordered - jsonifiable object to be sorted by key name.  Sorting is recursive.
 */
const copyWithSortedKeys = ( unordered: Record<string, IntentionalAny> ): Record<string, IntentionalAny> => {
  if ( Array.isArray( unordered ) ) {
    return unordered.map( copyWithSortedKeys );
  }
  else if ( typeof unordered !== 'object' || unordered === null ) {
    return unordered;
  }

  const ordered: Record<string, IntentionalAny> = {};
  Object.keys( unordered ).sort().forEach( key => {
    const value = unordered[ key ];
    ordered[ key ] = copyWithSortedKeys( value );
  } );
  return ordered;
};

export default ( api: object ): string => {
  assert( api, 'api expected' );
  const objectString = JSON.stringify( copyWithSortedKeys( api ), null, 2 );
  return fixEOL( objectString );
};