// Copyright 2017, University of Colorado Boulder

/**
 * Returns the brand suffix, given a brand name.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

/**
 * Returns the brand suffix, given a brand name (e.g. 'phet' => '-phet', 'phet-io' => '-phetio', 'adapted-from-phet' => '-adaptedFromPhet')
 * @public
 *
 * @param {string} brand
 * @returns {string}
 */
module.exports = function( brand ) {
  if ( brand === 'phet-io' ) {
    return 'phetio';
  }
  return brand.split( '-' ).map( function( bit, index ) {
    return ( index > 0 ? bit[ 0 ].toUpperCase() : bit[ 0 ] ) + bit.slice( 1 );
  } ).join( '' );
};
