// Copyright 2013-2015, University of Colorado Boulder

/**
 * Returns the brand suffix, given a brand name.
 */

/* eslint-env browser, node */
'use strict';

(function() {

  /**
   * Returns the brand suffix, given a brand name (e.g. 'phet' => '-phet', 'phet-io' => '-phetio', 'adapted-from-phet' => '-adaptedFromPhet')
   * @public
   *
   * @param {string} brand
   * @returns {string}
   */
  function brandToSuffix( brand ) {
    if ( brand === 'phet-io' ) {
      return 'phetio';
    }
    return brand.split( '-' ).map( function( bit, index ) {
      return ( index > 0 ? bit[ 0 ].toUpperCase() : bit[ 0 ] ) + bit.slice( 1 );
    } ).join( '' );
  }

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return brandToSuffix;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = brandToSuffix;
  }
})();
